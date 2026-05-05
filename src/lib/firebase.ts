import { initializeApp } from 'firebase/app';
import { getAuth, OAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const discordProvider = new OAuthProvider('discord.com');
discordProvider.addScope('identify');
discordProvider.addScope('email');
