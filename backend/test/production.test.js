import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { homeRouter } from '../src/routes/home.js';
import { User } from '../src/models/User.js';
import { CommunityPost } from '../src/models/CommunityPost.js';
import { UploadedMedia } from '../src/models/UploadedMedia.js';
import { getMediaFromDb, saveMediaToDb } from '../src/routes/uploads.js';

test('production refuses database-free startup; development starts all routers', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tcm-startup-'));
  const script = fileURLToPath(new URL('../src/server.js', import.meta.url));
  const env = {...process.env, MONGODB_URI:'', JWT_SECRET:'test-only-secret', PUBLIC_ORIGIN:'https://example.test', UPLOADS_DIR:dir, HOST:'127.0.0.1', PORT:'0'};
  try {
    const prod = spawn(process.execPath,[script],{cwd:dir,env:{...env,NODE_ENV:'production'}});
    let errors='';prod.stderr.on('data',c=>errors+=c);prod.stdout.resume();
    assert.equal((await once(prod,'exit'))[0],1);
    assert.match(errors,/MONGODB_URI is required/);
    const dev = spawn(process.execPath,[script],{cwd:dir,env:{...env,NODE_ENV:'development'}});
    try {
      await new Promise((resolve,reject)=>{
        const timeout=setTimeout(()=>{dev.kill();reject(new Error('Development startup timed out'));},15000);
        dev.stdout.on('data',c=>{if(c.toString().includes('API running')){clearTimeout(timeout);resolve();}});
        dev.stderr.resume();
        dev.on('exit',code=>{clearTimeout(timeout);reject(new Error(`Unexpected startup exit ${code}`));});
      });
    } finally {dev.kill();await once(dev,'exit');}
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});

test('failed post writes never return success; temporary media is rejected', async () => {
  const oldEnv=process.env.NODE_ENV;process.env.NODE_ENV='production';
  const oldFind=User.findById, oldCreate=CommunityPost.create;
  const id='507f1f77bcf86cd799439011';
  User.findById=()=>({select:()=>({lean:async()=>({_id:id,name:'Persistence Test',role:'student'})})});
  CommunityPost.create=async()=>{throw new Error('simulated database write failure');};
  const app=express();app.use(express.json());app.use('/api/home',homeRouter);
  const server=app.listen(0,'127.0.0.1');await once(server,'listening');
  const token=jwt.sign({sub:id},process.env.JWT_SECRET||'tcm_local_dev_secret_change_before_production');
  const send=body=>fetch(`http://127.0.0.1:${server.address().port}/api/home/posts`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(body)});
  try {
    assert.equal((await send({text:'test',privacy:'private'})).status,503);
    assert.equal((await send({text:'test',media:{kind:'photo',imageUrl:'blob:temporary'}})).status,400);
    User.findById=()=>({select:()=>({lean:async()=>null})});
    assert.equal((await send({text:'test'})).status,401);
  } finally {
    server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
    User.findById=oldFind;CommunityPost.create=oldCreate;
    if(oldEnv===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=oldEnv;
  }
});

test('media restoration returns bytes and oversized files skip BSON storage', async () => {
  const oldState=mongoose.connection.readyState, oldFind=UploadedMedia.findOne, oldUpdate=UploadedMedia.findOneAndUpdate;
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'tcm-media-'));
  mongoose.connection.readyState=1;
  try {
    const expected=Buffer.from('persistent media');
    UploadedMedia.findOne=async()=>({mimeType:'image/png',data:expected});
    assert.deepEqual((await getMediaFromDb('test.png')).data,expected);
    const file=path.join(dir,'large.mp4');fs.writeFileSync(file,'');fs.truncateSync(file,16*1024*1024);
    UploadedMedia.findOneAndUpdate=()=>{assert.fail('Oversized BSON write attempted');};
    await saveMediaToDb('large.mp4','video/mp4',file);
  } finally {
    mongoose.connection.readyState=oldState;UploadedMedia.findOne=oldFind;UploadedMedia.findOneAndUpdate=oldUpdate;
    fs.rmSync(dir,{recursive:true,force:true});
  }
});
