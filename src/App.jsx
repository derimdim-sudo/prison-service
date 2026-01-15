import React, { useState, useEffect } from 'react';
import { 
  Home, MessageCircle, UserCog, Send, Calendar, CreditCard, 
  FileText, Phone, Video, Info, LogOut, ChevronLeft, X, 
  PhoneCall, ShoppingCart, Mail, MapPin 
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, onSnapshot, updateDoc, doc, serverTimestamp, deleteDoc 
} from 'firebase/firestore';

// ------------------------------------------------------------------
// ⚠️ ส่วนที่ต้องแก้ไข: ใส่รหัส Firebase ของคุณตรงนี้
// ------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyCLcHl_DENEAGZucJem_9SLnp0tJBdsM94",
  authDomain: "prison-service.firebaseapp.com",
  projectId: "prison-service",
  storageBucket: "prison-service.firebasestorage.app",
  messagingSenderId: "1025264686977",
  appId: "1:1025264686977:web:229925afb5e7daa5d77a80"
};

// เริ่มต้นระบบ
let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase Error: ยังไม่ได้ใส่รหัส Config หรือใส่ผิด", e);
}

const appId = 'prison-service-v1'; // ตั้งชื่อแอพ

// --- ข้อมูลปุ่มเมนู ---
const SERVICE_LINKS = [
  { 
    id: 1, 
    title: "ซื้อสินค้า", 
    icon: <img src="https://img.icons8.com/fluency/96/shopping-bag.png" alt="Shopping" className="w-10 h-10 object-contain drop-shadow-sm transition-transform group-hover:scale-110" />,
    color: "bg-blue-50/50", 
    url: "https://line.me/R/ti/p/@497pfcsg" 
  },
  { 
    id: 2, 
    title: "จองเยี่ยมออนไลน์", 
    icon: <img src="https://img.icons8.com/fluency/96/video-call.png" alt="Video Call" className="w-10 h-10 object-contain drop-shadow-sm transition-transform group-hover:scale-110" />,
    color: "bg-purple-50/50", 
    url: "https://line.me/R/ti/p/@414picns" 
  },
  { 
    id: 3, 
    title: "ฝากเงิน", 
    icon: <img src="https://img.icons8.com/fluency/96/card-wallet.png" alt="Wallet" className="w-10 h-10 object-contain drop-shadow-sm transition-transform group-hover:scale-110" />,
    color: "bg-emerald-50/50", 
    url: "https://line.me/R/ti/p/@800sowjt" 
  },
  { 
    id: 4, 
    title: "จดหมายออนไลน์", 
    icon: <img src="https://img.icons8.com/fluency/96/mail.png" alt="Mail" className="w-10 h-10 object-contain drop-shadow-sm transition-transform group-hover:scale-110" />,
    color: "bg-orange-50/50", 
    action: 'domimail' 
  },
  { 
    id: 8, 
    title: "แผนที่", 
    icon: <img src="https://upload.wikimedia.org/wikipedia/commons/a/aa/Google_Maps_icon_%282020%29.svg" alt="Google Maps" className="w-10 h-10 object-contain drop-shadow-sm transition-transform group-hover:scale-110" />,
    color: "bg-red-50/50", 
    url: "https://maps.app.goo.gl/zVNwXmuahTLjKKHo6" 
  },
  { 
    id: 7, 
    title: "ถาม-ตอบ", 
    icon: <img src="https://img.icons8.com/fluency/96/chat-message.png" alt="Chat" className="w-10 h-10 object-contain drop-shadow-sm transition-transform group-hover:scale-110" />,
    color: "bg-pink-50/50", 
    action: 'qa' 
  },
];

// --- Components ---

const GlassButton = ({ link, onClick }) => {
  return (
    <button 
      onClick={() => onClick(link)}
      className="group relative flex flex-col items-center justify-center p-2 h-32 w-full bg-white/40 backdrop-blur-md border border-white/40 shadow-[0_4px_16px_0_rgba(31,38,135,0.08)] rounded-2xl hover:bg-white/60 hover:scale-[1.02] active:scale-95 transition-all duration-300 font-prompt cursor-pointer"
    >
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-2xl pointer-events-none"></div>
      <div className={`p-2.5 rounded-xl mb-1.5 shadow-sm backdrop-blur-sm ${link.color} flex items-center justify-center`}>
        {link.icon}
      </div>
      <span className="text-gray-800 text-sm font-semibold text-center leading-tight drop-shadow-sm mt-0.5">{link.title}</span>
    </button>
  );
};

const GlassCallButton = () => (
  <a href="tel:021932301" target="_self" className="relative flex items-center justify-center gap-4 w-full bg-gradient-to-r from-emerald-500/80 to-teal-600/80 backdrop-blur-md border border-white/30 text-white p-5 rounded-3xl shadow-lg hover:shadow-emerald-500/30 active:scale-95 transition-all duration-300 mb-6 overflow-hidden group font-prompt">
    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
    <div className="bg-white/20 p-3 rounded-full animate-pulse backdrop-blur-sm shadow-inner border border-white/20"><PhoneCall size={28} /></div>
    <div className="text-left z-10">
      <div className="text-sm font-medium text-emerald-50">โทรด่วนสอบถามเจ้าหน้าที่</div>
      <div className="text-2xl font-bold tracking-widest text-white drop-shadow-md">02-193-2301</div>
    </div>
  </a>
);

// --- Main App ---
export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); 
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [adminPin, setAdminPin] = useState("");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => { try { await signInAnonymously(auth); } catch (e) { console.error(e); } };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'family_questions');
    return onSnapshot(q, (snapshot) => {
      const loadedQuestions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      loadedQuestions.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setQuestions(loadedQuestions);
    });
  }, [user]);

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim() || !user || !db) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'family_questions'), {
      text: newQuestion, status: 'pending', reply: '', timestamp: serverTimestamp(), userId: user.uid
    });
    setNewQuestion("");
  };
  
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPin === "1234") { 
      setIsAdminLoggedIn(true); 
      setAdminPin(""); 
      setLoginError("");
    } else { 
      setLoginError("รหัสผ่านไม่ถูกต้อง");
    }
  };
  
  const handleReply = async (id, reply) => {
    if (!db) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'family_questions', id), { reply, status: 'answered', answeredAt: serverTimestamp() });
  };
  
  const handleDelete = async (id) => {
    if(!db) return;
    if(window.confirm("ยืนยันการลบ?")) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'family_questions', id));
  };

  // ฟังก์ชันจัดการการกดปุ่ม (เช็ค OS เพื่อโหลดแอป DomiMail)
  const handleServiceClick = (link) => {
    if (link.action === 'qa') {
      setActiveTab('qa');
    } else if (link.action === 'domimail') {
      // ตรวจสอบว่าเป็นมือถือรุ่นไหน
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      
      if (/android/i.test(userAgent)) {
        // Android Link (แก้ไขใหม่ให้ถูกต้อง)
        window.open('https://play.google.com/store/apps/details?id=com.domitech.app', '_blank');
      } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        // iOS Link (แก้ไขใหม่ให้ถูกต้อง)
        window.open('https://apps.apple.com/th/app/domimail/id1604424556', '_blank');
      } else {
        // PC Link
        window.open('https://www.domimail.net/', '_blank');
      }
    } else if (link.url) {
      // ลิงค์ทั่วไป
      const target = (link.url.startsWith('tel:') || link.url.startsWith('#')) ? '_self' : '_blank';
      window.open(link.url, target);
    }
  };

  return (
    <div className="min-h-screen font-sans bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200 fixed inset-0 overflow-y-auto">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600&display=swap');
        .font-prompt { font-family: 'Prompt', sans-serif; }
      `}</style>

      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
      <div className="fixed top-[10%] right-[-10%] w-[50%] h-[50%] bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
      
      <header className="relative z-30 pt-10 pb-4 px-6 mb-2">
        <div className="max-w-md mx-auto flex items-center justify-between">
           {activeTab === 'home' ? (
             <div className="w-full flex flex-col items-center justify-center text-center">
                 <h1 className="text-3xl font-medium text-gray-800 tracking-tight leading-none mb-1 drop-shadow-sm font-prompt">
                    ศูนย์รวม<br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-indigo-800">บริการดิจิทัล</span>
                 </h1>
                 <div className="flex items-center gap-3 opacity-70 mt-1">
                    <div className="h-px w-8 bg-gray-600"></div>
                    <p className="text-[10px] font-normal tracking-[0.2em] text-gray-700 uppercase font-prompt">
                        CYI SMART SERVICE 2026
                    </p>
                    <div className="h-px w-8 bg-gray-600"></div>
                 </div>
             </div>
           ) : (
             <div className="flex items-center gap-3 bg-white/30 backdrop-blur-xl border border-white/40 shadow-lg rounded-2xl p-4 w-full">
               <button onClick={() => setActiveTab('home')} className="bg-white/40 p-2 rounded-xl hover:bg-white/60 transition-colors border border-white/50 shadow-sm"><ChevronLeft size={24} className="text-gray-700" /></button>
               <h1 className="text-xl font-bold text-gray-800 font-prompt">{activeTab === 'qa' ? 'ฝากคำถาม' : 'เจ้าหน้าที่'}</h1>
             </div>
           )}
        </div>
      </header>

      <main className="relative z-10 max-w-md mx-auto px-4 pb-24">
        {activeTab === 'home' && (
          <div className="animate-fade-in space-y-6">
            <GlassCallButton />
            <div className="grid grid-cols-3 gap-3">
              {SERVICE_LINKS.map(link => (
                <GlassButton 
                  key={link.id} 
                  link={link} 
                  onClick={handleServiceClick} 
                />
              ))}
            </div>
            <div className="mt-8 text-center">
              <button onClick={() => setActiveTab('admin')} className="text-gray-500 text-xs py-2 px-6 rounded-full bg-white/20 border border-white/30 backdrop-blur-sm hover:bg-white/40 shadow-sm font-prompt">เข้าสู่ระบบเจ้าหน้าที่</button>
            </div>
          </div>
        )}

        {/* ... (ส่วนอื่นๆ เหมือนเดิม) ... */}
        {activeTab === 'qa' && (
          <div className="animate-fade-in">
            <div className="bg-white/30 backdrop-blur-xl border border-white/40 rounded-3xl p-6 mb-8 shadow-lg">
              <h2 className="text-xl font-black text-gray-800 mb-2 font-prompt">พิมพ์ข้อความ</h2>
              <form onSubmit={handleSubmitQuestion} className="flex flex-col gap-4">
                <textarea value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} placeholder="พิมพ์คำถาม..." className="w-full bg-white/40 border border-white/50 rounded-2xl p-4 text-lg focus:outline-none focus:bg-white/60 min-h-[140px] font-prompt" />
                <button type="submit" disabled={!newQuestion.trim()} className="bg-gradient-to-r from-blue-600/90 to-indigo-600/90 text-white rounded-2xl py-4 font-bold text-lg flex justify-center gap-3 shadow-lg active:scale-95 disabled:opacity-50 font-prompt"><Send size={24} /> ส่งข้อความ</button>
              </form>
            </div>
            <div className="space-y-4">
              {questions.map(q => (
                <div key={q.id} className="bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between mb-3"><span className="text-xs font-bold text-gray-600 bg-white/40 px-3 py-1 rounded-lg font-prompt">{q.timestamp?.toDate ? new Date(q.timestamp.toDate()).toLocaleString('th-TH') : 'เมื่อสักครู่'}</span> <span className={`text-xs px-3 py-1 rounded-full font-bold font-prompt ${q.status === 'answered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{q.status === 'answered' ? 'ตอบแล้ว' : 'รอตอบ'}</span></div>
                  <p className="text-gray-800 text-lg font-medium font-prompt">{q.text}</p>
                  {q.reply && <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100/50 mt-2"><p className="text-gray-800 text-lg font-medium font-prompt">จนท: {q.reply}</p></div>}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'admin' && (
           <div className="animate-fade-in">
             {!isAdminLoggedIn ? (
               <div className="bg-white/30 backdrop-blur-xl border border-white/40 p-8 rounded-[32px] text-center mt-6">
                 <h2 className="text-2xl font-black text-gray-800 mb-4 font-prompt">ยืนยันตัวตน</h2>
                 <form onSubmit={handleAdminLogin}>
                   <input type="password" value={adminPin} onChange={(e) => setAdminPin(e.target.value)} className="w-full text-center text-4xl border-b-2 border-white/50 bg-transparent py-4 mb-8 outline-none font-prompt" placeholder="••••" maxLength={4} />
                   {loginError && <p className="text-red-600 font-bold mb-4 bg-red-100/50 py-2 rounded-lg font-prompt">{loginError}</p>}
                   <button type="submit" className="w-full bg-gray-800/90 text-white py-4 rounded-2xl font-bold text-lg shadow-xl active:scale-95 font-prompt">เข้าสู่ระบบ</button>
                 </form>
                 <p className="mt-4 text-xs text-gray-500 font-prompt">รหัส: 1234</p>
               </div>
             ) : (
                <div className="space-y-4">
                   <div className="flex justify-between bg-white/30 p-4 rounded-2xl font-prompt"><span className="font-bold">Admin Mode</span><button onClick={() => setIsAdminLoggedIn(false)} className="text-red-600 font-bold">ออก</button></div>
                   {questions.map(q => (
                     <div key={q.id} className="bg-white/40 p-5 rounded-2xl border border-white/50">
                        <div className="flex justify-between mb-2"><span className="text-xs bg-white/50 px-2 py-1 rounded font-prompt">{new Date(q.timestamp?.toDate()).toLocaleTimeString('th-TH')}</span> <button onClick={() => handleDelete(q.id)}><X size={18} className="text-gray-400" /></button></div>
                        <p className="font-medium mb-3 font-prompt">{q.text}</p>
                        {q.status !== 'answered' ? (
                          <div className="flex gap-2"><input type="text" placeholder="ตอบ..." className="flex-1 p-2 rounded-lg bg-white/50 font-prompt" onKeyDown={(e) => { if(e.key === 'Enter') handleReply(q.id, e.target.value) }} /><button className="bg-blue-600 text-white px-4 rounded-lg font-prompt" onClick={(e) => handleReply(q.id, e.target.previousSibling.value)}>ส่ง</button></div>
                        ) : <div className="bg-green-100 p-2 rounded text-green-800 font-prompt">ตอบแล้ว: {q.reply}</div>}
                     </div>
                   ))}
                </div>
             )}
           </div>
        )}
      </main>
    </div>
  );
}