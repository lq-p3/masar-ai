import { getFirestore } from '../config/firestore.js';

async function fixMasterResume() {
  const db = getFirestore();
  const uid = 'bqNWhDJpVyU2DjhLd3SiSDv6KLl1';
  const masterDocId = 'MFVj7yaGy4KqlLd6mIvN';

  const masterText = `ALI ABDULLAH AL-QAHTANI
FULL STACK & CLOUD AI ENGINEER
Saudi Arabia | Open to relocation | +966 50 982 4523 | mz5040zm@email.com
linkedin.com/in/ali-alqhtani-2a8297333 | github.com/lq-p3

PROFESSIONAL SUMMARY
Versatile Computer Science graduate with a 4.63/5.00 GPA from King Khalid University (Artificial Intelligence Track). Proven track record in developing full-stack applications, intelligent AI pipelines, and cloud-native services using Google Cloud Run, TypeScript, React 19, Node.js, Python, and Firebase. Hands-on experience from Tuwaiq Academy, KAUST Academy (Distinction level AI), and Saudi Electricity Company.

EDUCATION
Bachelor of Science in Computer Science, Artificial Intelligence Track | King Khalid University | GPA: 4.63/5.00

CORE TECHNICAL SKILLS
- Cloud & DevOps: Google Cloud Platform (GCP), Cloud Run, Docker, Secret Manager, Cloud Build, CI/CD, Nginx
- Backend & APIs: Node.js, Express, TypeScript, REST APIs, FastAPI, ASP.NET Core, SignalR, JWT Authentication
- Frontend & Mobile: React 19, TypeScript, Tailwind CSS, Vite, Responsive Design, State Management
- AI & Data Science: Python, PyTorch, TensorFlow, Scikit-learn, XGBoost, Pandas, NumPy, NLP, Computer Vision, CAMeLBERT
- Databases & Storage: Cloud Firestore, Google Cloud Storage, PostgreSQL, SQL, Redis`;

  await db.collection('users').doc(uid).collection('resumes').doc(masterDocId).update({
    resumeText: masterText,
    updatedAt: new Date().toISOString()
  });

  console.log('Successfully updated Master_Resume.pdf with rich full-stack profile text!');
}

fixMasterResume();
