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
import { adminRouter } from '../src/routes/admin.js';
import { jobsRouter } from '../src/routes/jobs.js';
import { governmentRouter } from '../src/routes/government.js';
import { User } from '../src/models/User.js';
import { CommunityPost } from '../src/models/CommunityPost.js';
import { Course } from '../src/models/Course.js';
import { Wallet } from '../src/models/Wallet.js';
import { WalletTransaction } from '../src/models/WalletTransaction.js';
import { Payment } from '../src/models/Payment.js';
import { Enrollment } from '../src/models/Enrollment.js';
import { Program } from '../src/models/Program.js';
import { Lead } from '../src/models/Lead.js';
import { Event } from '../src/models/Event.js';
import { CmsPost, Testimonial, AppSetting } from '../src/models/CmsContent.js';
import { Notification } from '../src/models/Notification.js';
import { UploadedMedia } from '../src/models/UploadedMedia.js';
import { getMediaFromDb, saveMediaToDb } from '../src/routes/uploads.js';
import { getOperationalMetrics, requestMetrics, resetOperationalMetrics } from '../src/services/operationalMetrics.js';

test('operational metrics expose rolling HTTP and database failure signals', async () => {
  resetOperationalMetrics();
  const app=express();app.use(requestMetrics);
  app.get('/ok',(req,res)=>res.json({ok:true}));
  app.get('/unauthorized',(req,res)=>res.status(401).json({message:'no'}));
  app.get('/error',(req,res)=>res.status(500).json({message:'failed'}));
  app.get('/database',(req,res)=>{res.setHeader('x-tcm-database-unavailable','1');res.status(503).json({message:'database'});});
  const server=app.listen(0,'127.0.0.1');await once(server,'listening');
  const base=`http://127.0.0.1:${server.address().port}`;
  try {
    await fetch(`${base}/ok`);await fetch(`${base}/unauthorized`);await fetch(`${base}/error`);await fetch(`${base}/database`);
    await new Promise(resolve=>setImmediate(resolve));
    const metrics=getOperationalMetrics();
    assert.equal(metrics.requests,4);assert.equal(metrics.clientErrors,1);assert.equal(metrics.serverErrors,2);
    assert.equal(metrics.authFailures,1);assert.equal(metrics.databaseUnavailable,1);assert.equal(metrics.serverErrorRate,0.5);
  } finally {
    server.closeAllConnections();await new Promise(resolve=>server.close(resolve));resetOperationalMetrics();
  }
});

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

test('production admin self-registration is disabled by default', async () => {
  const oldEnv=process.env.NODE_ENV, oldSignup=process.env.ADMIN_SIGNUP_ENABLED;
  process.env.NODE_ENV='production';delete process.env.ADMIN_SIGNUP_ENABLED;
  const app=express();app.use(express.json());app.use('/api/admin',adminRouter);
  const server=app.listen(0,'127.0.0.1');await once(server,'listening');
  try {
    const response=await fetch(`http://127.0.0.1:${server.address().port}/api/admin/signup`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({name:'Unauthorized Admin',email:'attacker@example.test',password:'password123'})
    });
    assert.equal(response.status,403);
    assert.match((await response.json()).message,/disabled/i);
  } finally {
    server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
    if(oldEnv===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=oldEnv;
    if(oldSignup===undefined)delete process.env.ADMIN_SIGNUP_ENABLED;else process.env.ADMIN_SIGNUP_ENABLED=oldSignup;
  }
});

test('job applicant PII and mutations require authenticated ownership', async () => {
  const oldEnv=process.env.NODE_ENV, oldFind=User.findById, oldState=mongoose.connection.readyState;
  process.env.NODE_ENV='production';mongoose.connection.readyState=0;
  const users={
    mentor:{_id:'mentor',name:'Verified Mentor',email:'mentor@example.test',role:'mentor',isApproved:true},
    student:{_id:'student',name:'Real Student',email:'student@example.test',role:'student'},
    other:{_id:'other',name:'Other Student',email:'other@example.test',role:'student'}
  };
  User.findById=(id)=>({select:()=>({lean:async()=>users[String(id)]||null})});
  const app=express();app.use(express.json());app.locals.memoryStore={jobs:[{
    id:'job-1',title:'Security Engineer',description:'Protect systems',mentorId:'mentor',mentorName:'Verified Mentor',
    requiredCandidates:2,status:'active',applicants:[{userId:'student',name:'Real Student',email:'student@example.test',phone:'123',status:'pending'}]
  }]};app.use('/api/jobs',jobsRouter);
  const server=app.listen(0,'127.0.0.1');await once(server,'listening');
  const base=`http://127.0.0.1:${server.address().port}/api/jobs`;
  const token=(sub)=>jwt.sign({sub},process.env.JWT_SECRET||'tcm_local_dev_secret_change_before_production');
  const auth=(sub)=>({'Content-Type':'application/json',Authorization:`Bearer ${token(sub)}`});
  try {
    const publicList=await (await fetch(base)).json();
    assert.equal(publicList.jobs[0].applicants,undefined);
    assert.equal(publicList.jobs[0].appliedCandidates,1);
    assert.equal((await fetch(base,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,401);

    const studentList=await (await fetch(base,{headers:auth('student')})).json();
    assert.equal(studentList.jobs[0].hasApplied,true);
    assert.equal(studentList.jobs[0].applicants,undefined);
    assert.equal((await fetch(`${base}/job-1/applicants`,{headers:auth('student')})).status,403);

    const applied=await fetch(`${base}/job-1/apply`,{
      method:'POST',headers:auth('other'),
      body:JSON.stringify({userId:'spoofed',name:'Spoofed',email:'spoofed@example.test',phone:'456'})
    });
    assert.equal(applied.status,200);
    const stored=app.locals.memoryStore.jobs[0].applicants[0];
    assert.equal(stored.userId,'other');assert.equal(stored.name,'Other Student');assert.equal(stored.email,'other@example.test');

    assert.equal((await fetch(`${base}/job-1/applicants/other/status`,{method:'PUT',headers:auth('student'),body:JSON.stringify({status:'selected'})})).status,403);
    const managed=await fetch(`${base}/job-1/applicants/other/status`,{method:'PUT',headers:auth('mentor'),body:JSON.stringify({status:'selected'})});
    assert.equal(managed.status,200);
    const applicants=await (await fetch(`${base}/job-1/applicants`,{headers:auth('mentor')})).json();
    assert.equal(applicants.applicants.length,2);assert.equal(applicants.applicants[0].status,'selected');
    const edited=await fetch(`${base}/job-1`,{method:'PUT',headers:auth('mentor'),body:JSON.stringify({title:'Updated title',mentorId:'other',applicants:[]})});
    assert.equal(edited.status,200);assert.equal(app.locals.memoryStore.jobs[0].mentorId,'mentor');assert.equal(app.locals.memoryStore.jobs[0].applicants.length,2);
  } finally {
    server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
    User.findById=oldFind;mongoose.connection.readyState=oldState;
    if(oldEnv===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=oldEnv;
  }
});

test('course mutations and allocation require creator ownership', async () => {
  const oldEnv=process.env.NODE_ENV, oldFind=User.findById, oldState=mongoose.connection.readyState;
  const oldCourseFind=Course.findOne, oldCourseFindById=Course.findById, oldCourseUpdate=Course.findOneAndUpdate;
  process.env.NODE_ENV='production';mongoose.connection.readyState=0;
  const users={
    mentor:{_id:'mentor',name:'Course Owner',email:'mentor@example.test',role:'mentor',isApproved:true},
    student:{_id:'student',name:'Learner',email:'student@example.test',role:'student',enrolledCourses:[]},
    other:{_id:'other',name:'Other User',email:'other@example.test',role:'student'},
    admin:{_id:'admin',name:'Administrator',email:'admin@example.test',role:'admin'}
  };
  User.findById=(id)=>({select:()=>({lean:async()=>users[String(id)]||null})});
  Course.findOne=()=>({lean:async()=>null});Course.findById=async()=>null;Course.findOneAndUpdate=()=>({lean:async()=>null});
  const course={id:'course-1',customId:'course-1',title:'Owned Course',price:'₹999',mentorId:'mentor',status:'Active'};
  const app=express();app.use(express.json());app.locals.memoryStore={courses:[course],users:[users.student],notifications:[]};
  app.use('/api/home',homeRouter);app.use('/api/admin',adminRouter);app.use('/api/government',governmentRouter);
  const server=app.listen(0,'127.0.0.1');await once(server,'listening');
  const base=`http://127.0.0.1:${server.address().port}/api`;
  const token=(sub)=>jwt.sign({sub},process.env.JWT_SECRET||'tcm_local_dev_secret_change_before_production');
  const auth=(sub)=>({'Content-Type':'application/json',Authorization:`Bearer ${token(sub)}`});
  try {
    assert.equal((await fetch(`${base}/home/courses`,{method:'POST',headers:auth('student'),body:JSON.stringify({title:'Unauthorized'})})).status,403);
    assert.equal((await fetch(`${base}/home/webinars`,{method:'POST',headers:auth('student'),body:JSON.stringify({title:'Unauthorized',description:'No'})})).status,403);
    assert.equal((await fetch(`${base}/home/courses/course-1`,{method:'PUT',headers:auth('other'),body:JSON.stringify({title:'Hijacked'})})).status,404);
    const updated=await fetch(`${base}/home/courses/course-1`,{method:'PUT',headers:auth('mentor'),body:JSON.stringify({title:'Owner Update'})});
    assert.equal(updated.status,200);assert.equal(course.title,'Owner Update');

    const allocationBody=JSON.stringify({studentId:'student',courseId:'course-1'});
    assert.equal((await fetch(`${base}/admin/allocate-course`,{method:'POST',headers:auth('student'),body:allocationBody})).status,403);
    assert.equal((await fetch(`${base}/admin/allocate-course`,{method:'POST',headers:auth('mentor'),body:allocationBody})).status,200);
    assert.equal(users.student.enrolledCourses.length,1);assert.equal(users.student.enrolledCourses[0].courseTitle,'Owner Update');

    const scheduleBody=JSON.stringify({status:'Active',nextClassDate:'Tomorrow'});
    assert.equal((await fetch(`${base}/admin/courses/course-1/schedule`,{method:'PATCH',headers:auth('other'),body:scheduleBody})).status,403);
    assert.equal((await fetch(`${base}/admin/courses/course-1/schedule`,{method:'PATCH',headers:auth('mentor'),body:scheduleBody})).status,200);

    assert.equal((await fetch(`${base}/home/wallet/add-money`,{method:'POST',headers:auth('student'),body:JSON.stringify({amount:100000})})).status,503);
    assert.equal((await fetch(`${base}/home/wallet/convert-referral`,{method:'POST',headers:auth('student'),body:JSON.stringify({friendName:'Fake'})})).status,503);
    assert.equal((await fetch(`${base}/government/sources/sync`,{method:'POST',headers:auth('student'),body:JSON.stringify({sourceId:'source'})})).status,403);
    assert.equal((await fetch(`${base}/government/sources/sync`,{method:'POST',headers:auth('admin'),body:JSON.stringify({sourceId:'source'})})).status,501);
  } finally {
    server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
    User.findById=oldFind;Course.findOne=oldCourseFind;Course.findById=oldCourseFindById;Course.findOneAndUpdate=oldCourseUpdate;
    mongoose.connection.readyState=oldState;
    if(oldEnv===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=oldEnv;
  }
});

test('migrated wallet and financial records are exposed through authenticated read paths', async () => {
  const oldEnv=process.env.NODE_ENV, oldFind=User.findById, oldState=mongoose.connection.readyState;
  const oldWalletFind=Wallet.findOne, oldTransactionFind=WalletTransaction.find, oldPaymentFind=Payment.find;
  const oldEnrollmentFind=Enrollment.find, oldCourseFind=Course.find;
  process.env.NODE_ENV='production';mongoose.connection.readyState=1;
  const user={_id:'507f1f77bcf86cd799439011',name:'Migrated User',email:'migrated@example.test',role:'student'};
  User.findById=()=>({select:()=>({lean:async()=>user}),lean:async()=>user});
  Wallet.findOne=()=>({lean:async()=>({_id:'wallet-1',currency:'INR',balance:750,pendingBalance:50,metadata:{tcmCoins:25}})});
  const chain=(rows)=>{const query={populate:()=>query,sort:()=>query,limit:()=>query,lean:async()=>rows};return query;};
  WalletTransaction.find=()=>chain([{_id:'tx-1',userId:user,type:'credit',amount:750,balanceAfter:750,description:'Imported balance',referenceType:'migration',createdAt:new Date('2026-09-22T00:00:00Z')}]);
  Payment.find=()=>chain([{_id:'pay-1',userId:user,itemType:'course',amount:499,method:'UPI',status:'approved',paymentDate:new Date('2026-09-21T00:00:00Z')}]);
  const migratedCourse={_id:'507f1f77bcf86cd799439012',customId:'legacy-course',title:'Migrated Python',price:'₹499',modules:[{id:'module-1',title:'Python Basics'}]};
  Enrollment.find=()=>chain([{_id:'enrollment-1',userId:user._id,courseId:migratedCourse,status:'active',progressPercent:42,enrolledAt:new Date('2026-09-20T00:00:00Z')}]);
  Course.find=()=>({lean:async()=>[migratedCourse]});
  const app=express();app.use(express.json());app.use('/api/home',homeRouter);app.use('/api/admin',adminRouter);
  const server=app.listen(0,'127.0.0.1');await once(server,'listening');
  const base=`http://127.0.0.1:${server.address().port}/api`;
  const secret=process.env.JWT_SECRET||'tcm_local_dev_secret_change_before_production';
  const userToken=jwt.sign({sub:user._id},secret);
  const adminToken=jwt.sign({sub:'admin',role:'admin'},secret,{issuer:'tcm',audience:'tcm-app'});
  try {
    const walletResponse=await fetch(`${base}/home/wallet`,{headers:{Authorization:`Bearer ${userToken}`}});
    assert.equal(walletResponse.status,200);
    const wallet=(await walletResponse.json()).wallet;
    assert.equal(wallet.availableBalance,750);assert.equal(wallet.pendingBalance,50);assert.equal(wallet.transactions.length,1);

    const financeResponse=await fetch(`${base}/admin/financial-transactions`,{headers:{Authorization:`Bearer ${adminToken}`}});
    assert.equal(financeResponse.status,200);
    const finance=await financeResponse.json();
    assert.equal(finance.walletTransactionCount,1);assert.equal(finance.paymentCount,1);assert.equal(finance.transactions.length,2);

    const learningResponse=await fetch(`${base}/home/continue-learning`,{headers:{Authorization:`Bearer ${userToken}`}});
    assert.equal(learningResponse.status,200);
    const learning=await learningResponse.json();
    assert.equal(learning.courseTitle,'Migrated Python');assert.equal(learning.userProgress.courseProgress,42);
  } finally {
    server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
    User.findById=oldFind;Wallet.findOne=oldWalletFind;WalletTransaction.find=oldTransactionFind;Payment.find=oldPaymentFind;
    Enrollment.find=oldEnrollmentFind;Course.find=oldCourseFind;
    mongoose.connection.readyState=oldState;
    if(oldEnv===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=oldEnv;
  }
});

test('migrated programs, events, CMS and persisted notifications have safe read paths', async () => {
  const oldEnv=process.env.NODE_ENV, oldFindUser=User.findById, oldState=mongoose.connection.readyState;
  const models=[Program,Lead,Event,CmsPost,Testimonial,AppSetting,Notification];
  const originalFind=new Map(models.map((model)=>[model,model.find]));
  const originalCount=new Map(models.map((model)=>[model,model.countDocuments]));
  const oldUpdateMany=Notification.updateMany;
  process.env.NODE_ENV='production';mongoose.connection.readyState=1;
  const user={_id:'507f1f77bcf86cd799439011',name:'Migration Reader',email:'reader@example.test',role:'student'};
  User.findById=()=>({select:()=>({lean:async()=>user})});
  const rows={
    Program:[{_id:'program-1',title:'Career Launchpad',slug:'career-launchpad',publicationStatus:'published',sourceSystem:'mysql'}],
    Lead:[{_id:'lead-1',name:'Interested Learner',email:'lead@example.test',status:'new',sourceSystem:'mysql'}],
    Event:[{_id:'event-1',title:'Python Workshop',slug:'python-workshop',status:'upcoming',eventDate:new Date('2026-10-01T10:00:00Z'),sourceSystem:'mysql'}],
    CmsPost:[{_id:'post-1',title:'Build Your Career',slug:'build-career',status:'published',sourceSystem:'mysql'}],
    Testimonial:[{_id:'testimonial-1',name:'Learner',content:'Helpful',status:'active',sourceSystem:'mysql'}],
    AppSetting:[{_id:'setting-1',key:'site_name',value:'must-not-leak',sourceSystem:'mysql'}],
    Notification:[{_id:'507f1f77bcf86cd799439099',userId:user._id,title:'Welcome back',body:'Your migrated account is ready.',readAt:null,createdAt:new Date(),sourceSystem:'mysql'}]
  };
  const chain=(items)=>{const query={populate:()=>query,sort:()=>query,limit:()=>query,select:()=>query,lean:async()=>items};return query;};
  models.forEach((model)=>{model.find=()=>chain(rows[model.modelName]);model.countDocuments=async()=>rows[model.modelName].length;});
  let markedRead=false;
  Notification.updateMany=async()=>{markedRead=true;return {modifiedCount:1};};
  const app=express();app.use(express.json());app.use('/api/home',homeRouter);app.use('/api/admin',adminRouter);
  const server=app.listen(0,'127.0.0.1');await once(server,'listening');
  const base=`http://127.0.0.1:${server.address().port}/api`;
  const secret=process.env.JWT_SECRET||'tcm_local_dev_secret_change_before_production';
  const userToken=jwt.sign({sub:user._id},secret);
  const adminToken=jwt.sign({sub:'admin',role:'admin'},secret,{issuer:'tcm',audience:'tcm-app'});
  try {
    const programs=await (await fetch(`${base}/home/programs`)).json();
    assert.equal(programs.programs[0].title,'Career Launchpad');
    const events=await (await fetch(`${base}/home/events`)).json();
    assert.equal(events.events[0].title,'Python Workshop');

    const notificationsResponse=await fetch(`${base}/home/notifications`,{headers:{Authorization:`Bearer ${userToken}`}});
    assert.equal(notificationsResponse.status,200);
    const notifications=await notificationsResponse.json();
    assert.equal(notifications.notifications[0].title,'Welcome back');
    assert.equal(notifications.notifications[0].unread,true);
    assert.equal(notifications.unreadCount,1);
    assert.equal((await fetch(`${base}/home/notifications/read-all`,{method:'POST',headers:{Authorization:`Bearer ${userToken}`}})).status,200);
    assert.equal(markedRead,true);

    const adminResponse=await fetch(`${base}/admin/migration-content`,{headers:{Authorization:`Bearer ${adminToken}`}});
    assert.equal(adminResponse.status,200);
    const adminData=await adminResponse.json();
    assert.equal(adminData.counts.programs,1);assert.equal(adminData.counts.leads,1);assert.equal(adminData.counts.notifications,1);
    assert.equal(Object.hasOwn(adminData.collections.settings[0],'value'),false);
  } finally {
    server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
    User.findById=oldFindUser;models.forEach((model)=>{model.find=originalFind.get(model);model.countDocuments=originalCount.get(model);});Notification.updateMany=oldUpdateMany;
    mongoose.connection.readyState=oldState;
    if(oldEnv===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=oldEnv;
  }
});
