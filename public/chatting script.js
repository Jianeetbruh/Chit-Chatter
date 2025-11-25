// chat-script.js
// ---------- Firebase config (replace with your values) ----------
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MSG_ID",
  appId: "YOUR_APP_ID"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// ---------- Globals ----------
let me = null;           // current user doc
let currentChat = null;  // { type: 'user'|'group', id: 'uid' or groupId }
let messagesUnsub = null;

// ---------- Helpers ----------
function $(id){ return document.getElementById(id); }
function fmtTime(ts){ if(!ts) return ''; try { return new Date(ts.toDate()).toLocaleTimeString(); } catch { return ''; } }

// ---------- Auth state ----------
auth.onAuthStateChanged(async user => {
  if(!user) { location.href = '/index.html'; return; }
  const doc = await db.collection('users').doc(user.uid).get();
  me = { uid: user.uid, ...(doc.exists ? doc.data() : {}) };
  $('myName').innerText = me.username || (me.email && me.email.split('@')[0]) || 'You';
  $('myDesc').innerText = me.description || '';
  $('myAvatar').src = me.avatarURL || '/placeholder-avatar.png';
  watchRequests();
  watchFriends();
});

// ---------- FRIEND REQUESTS ----------
function watchRequests(){
  db.collection('friendRequests')
    .where('toUid','==', auth.currentUser.uid)
    .where('status','==','pending')
    .onSnapshot(snap=>{
      const list = $('requestsList'); list.innerHTML='';
      snap.forEach(d=>{
        const r = d.data();
        const el = document.createElement('div'); el.className='item';
        el.innerHTML = `<div style="flex:1"><div class="title">${r.fromName||r.fromUid}</div><div class="sub">${new Date(r.createdAt?.toDate?.()||Date.now()).toLocaleString()}</div></div>
                        <div><button onclick="acceptReq('${d.id}','${r.fromUid}')">Accept</button></div>`;
        list.appendChild(el);
      });
    });
}

async function acceptReq(requestId, fromUid){
  const meRef = db.collection('users').doc(auth.currentUser.uid);
  const otherRef = db.collection('users').doc(fromUid);
  const batch = db.batch();
  batch.update(meRef, { friends: firebase.firestore.FieldValue.arrayUnion(fromUid) });
  batch.update(otherRef, { friends: firebase.firestore.FieldValue.arrayUnion(auth.currentUser.uid) });
  batch.update(db.collection('friendRequests').doc(requestId), { status: 'accepted' });
  await batch.commit();
}

// ---------- FRIENDS LIST ----------
function watchFriends(){
  db.collection('users').doc(auth.currentUser.uid).onSnapshot(async snap=>{
    const data = snap.data(); const friends = data?.friends || [];
    const list = $('mainList'); list.innerHTML='';
    for(const fuid of friends){
      const d = await db.collection('users').doc(fuid).get(); const ud = d.data()||{};
      const el = document.createElement('div'); el.className='item';
      el.innerHTML = `<div class="avatar"><img src="${ud.avatarURL||'/placeholder-avatar.png'}"></div><div style="flex:1"><div class="title">${ud.username||fuid}</div><div class="sub">${ud.description||''}</div></div>`;
      el.onclick = ()=> openDM(fuid, ud);
      list.appendChild(el);
    }
  });
}

// ---------- Open DM ----------
function chatDocId(a,b){ return [a,b].sort().join('_'); }
function openDM(uid, ud){
  currentChat = { type:'user', id: uid };
  $('chatWithName').innerText = ud.username || uid;
  $('chatWithAvatar').src = ud.avatarURL || '/placeholder-avatar.png';
  listenMessages(chatDocId(auth.currentUser.uid, uid));
}

// ---------- Listen messages ----------
function listenMessages(chatId){
  if(messagesUnsub) messagesUnsub();
  const col = db.collection('chats').doc(chatId).collection('messages').orderBy('createdAt');
  messagesUnsub = col.onSnapshot(snap=>{
    const area = $('messages'); area.innerHTML='';
    snap.forEach(d=>{
      const m = d.data();
      const row = document.createElement('div'); row.className='msg-row ' + (m.fromUid===auth.currentUser.uid ? 'you' : 'other');
      const bubble = document.createElement('div'); bubble.className='msg ' + (m.fromUid===auth.currentUser.uid ? 'you' : 'other');
      bubble.innerText = m.text + (m.createdAt ? '\n' + fmtTime(m.createdAt) : '');
      row.appendChild(bubble); area.appendChild(row);
    });
    area.scrollTop = area.scrollHeight;
  });
}

// ---------- Send message ----------
$('sendBtn').onclick = async ()=>{
  const text = $('messageInput').value.trim();
  if(!text || !currentChat) return;
  if(currentChat.type==='user'){
    const chatId = chatDocId(auth.currentUser.uid, currentChat.id);
    await db.collection('chats').doc(chatId).collection('messages').add({
      fromUid: auth.currentUser.uid,
      text,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }
  $('messageInput').value='';
};

// ---------- Add friend / create group ----------
$('btnAdd').onclick = ()=> $('addModal').classList.remove('hidden');
$('closeAdd').onclick = ()=> $('addModal').classList.add('hidden');

$('addFriendBtn').onclick = async ()=>{
  const v = $('addInput').value.trim(); if(!v) return alert('Enter email');
  // find user by email
  const snap = await db.collection('users').where('email','==', v).get();
  if(snap.empty){ alert('User not found'); return; }
  const doc = snap.docs[0];
  await db.collection('friendRequests').add({
    fromUid: auth.currentUser.uid,
    fromName: me.username,
    toUid: doc.id,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    status: 'pending'
  });
  alert('Friend request sent'); $('addModal').classList.add('hidden');
};

$('createGroupBtn').onclick = async ()=>{
  const name = $('addInput').value.trim(); if(!name) return alert('Enter group name');
  const gRef = await db.collection('groups').add({
    name,
    creator: auth.currentUser.uid,
    members: [auth.currentUser.uid],
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  alert('Group created'); $('addModal').classList.add('hidden');
};

// ---------- Profile popup ----------
$('btnSettings').onclick = ()=> $('profileModal').classList.remove('hidden');
$('closeProfile').onclick = ()=> $('profileModal').classList.add('hidden');
$('saveProfile').onclick = async ()=>{
  const name = $('editName').value.trim();
  const desc = $('editDesc').value.trim();
  const avatar = $('editAvatarUrl').value.trim();
  await db.collection('users').doc(auth.currentUser.uid).update({ username: name, description: desc, avatarURL: avatar });
  $('profileModal').classList.add('hidden');
};

// ---------- Sign out on close ----------
window.addEventListener('beforeunload', async ()=> {
  const u = auth.currentUser;
  if(u) await db.collection('users').doc(u.uid).update({ online: false });
});
