import React, { useRef, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, signOut } from 'firebase/auth';
import { getFirestore, collection, query, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import {Filter} from 'bad-words'; 
import './App.css';
import { FaGoogle, FaGithub } from 'react-icons/fa'; 

const firebaseConfig = {
   // place ur config
};

// Firebase initialization
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
// eslint-disable-next-line
const analytics = getAnalytics(app);

function App() {
  const [user] = useAuthState(auth);

  return (
    <div className="bg-gradient-to-br from-indigo-100 via-orange-100 via-brown-100 via-gray-100 to-gray-200 min-h-screen flex flex-col items-center justify-center font-sans text-gray-800">
      <header className="w-full bg-orange bg-opacity-70 backdrop-blur-md text-gray-800 py-4 px-8 shadow-lg flex justify-between items-center border-b border-gray-300">
        <h1 className="text-4xl font-light tracking-wide">🔥 XChat</h1>
        <SignOut />
      </header>

      <section className="w-full max-w-3xl flex-grow mt-12">
        {user ? <ChatRoom /> : <SignIn />}
      </section>
    </div>
  );
}

function SignIn() {
  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  };

  const signInWithGithub = () => {
    const gitprovider = new GithubAuthProvider();
    signInWithPopup(auth, gitprovider);
  };

  return (
    <div className="flex flex-col items-center mt-12 space-y-4">
      <button
        onClick={signInWithGoogle}
        className="bg-blue-500 bg-opacity-70 hover:bg-opacity-90 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 shadow-xl transform hover:scale-105 backdrop-blur-sm"
      >
        <FaGoogle className="text-xl" />
        <span>Sign in with Google</span>
      </button>
      <button
        onClick={signInWithGithub}
        className="bg-gray-700 bg-opacity-70 hover:bg-opacity-90 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 shadow-xl transform hover:scale-105 backdrop-blur-sm"
      >
        <FaGithub className="text-xl" />
        <span>Sign In With Github</span>
      </button>
      <p className="mt-6 text-sm text-gray-500 italic">
        Say something nice here.
      </p>
    </div>
  );
}

function SignOut() {
  return (
    auth.currentUser && (
      <button
        onClick={() => signOut(auth)}
        className="bg-red-500 hover:bg-red-400 text-white font-semibold py-2 px-6 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
      >
        Sign Out
      </button>
    )
  );
}

function ChatRoom() {
  const scroller = useRef();
  const messagesRef = collection(firestore, 'messages');
  const q = query(messagesRef, orderBy('createdAt'), limit(100));

  const [messages] = useCollectionData(q, { idField: 'id' });
  const [formValue, setFormValue] = useState('');

  const filter = new Filter();

  const sendMessage = async (e) => {
    e.preventDefault();

    const { uid, photoURL } = auth.currentUser;
    const cleanedMessage = filter.clean(formValue);

    await addDoc(messagesRef, {
      text: cleanedMessage,
      createdAt: serverTimestamp(),
      uid,
      photoURL,
    });

    setFormValue('');
    scroller.current.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col h-full max-h-screen bg-white bg-opacity-50 backdrop-blur-md rounded-lg shadow-inner p-4">
      <main className="flex-grow p-4 overflow-auto space-y-4">
        {messages && messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
        <span ref={scroller}></span>
      </main>

      <form onSubmit={sendMessage} className="flex p-4 bg-gray-100 rounded-full shadow-lg mt-4 space-x-4">
        <input
          className="flex-grow p-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 bg-white bg-opacity-70 backdrop-blur-lg"
          value={formValue}
          onChange={(e) => setFormValue(e.target.value)}
          placeholder="Type a message..."
        />
        <button
          type="submit"
          disabled={!formValue}
          className="bg-blue-500 hover:bg-blue-400 text-white font-semibold py-3 px-6 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          📨
        </button>
      </form>
    </div>
  );
}

function ChatMessage(props) {
  const { text, uid, photoURL } = props.message;
  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';

  return (
    <div className={`flex items-start space-x-4 ${messageClass === 'sent' ? 'justify-end' : 'justify-start'}`}>
      <img
        className="w-10 h-10 rounded-full shadow-lg transform hover:scale-105 transition-all"
        src={photoURL || 'https://via.placeholder.com/150'}
        alt="User Avatar"
      />
      <div className={`p-4 rounded-lg shadow-xl ${messageClass === 'sent' ? 'bg-blue-500 text-white' : 'bg-white bg-opacity-80 backdrop-blur-lg'}`}>
        <p>{text}</p>
      </div>
    </div>
  );
}

export default App;
