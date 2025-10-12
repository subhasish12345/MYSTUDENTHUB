# MyStudentHub - All-in-One Campus Platform

Welcome to MyStudentHub, a modern, feature-rich, and scalable web application designed to be the central digital hub for any educational institution. Built with Next.js, Firebase, and ShadCN UI, this platform provides a seamless and integrated experience for students, teachers, and administrators.

This project was developed in collaboration with a project lead, demonstrating the power of AI-assisted development to rapidly prototype and build complex, real-world applications.

## ✨ Features

MyStudentHub is packed with features designed to enhance the campus experience, streamline communication, and boost productivity.

### Core Platform & Design
- **Modern Tech Stack**: Next.js 15 (App Router), React, TypeScript, and Tailwind CSS.
- **Role-Based Access Control**: Secure authentication and distinct dashboard experiences for **Admins**, **Teachers**, and **Students**.
- **Customizable Appearance**:
    - **Dark/Light Mode**: Full support for system, light, and dark themes.
    - **Animated Backgrounds**: A selection of 10 unique, animated background themes for dashboard personalization.
- **In-App & Push Notifications**: A complete notification system powered by Firebase Cloud Messaging to keep users informed about assignments, notices, and events.
- **Custom 404 Page**: A creative and engaging "Page Not Found" page with a retro TV animation.

### 👤 Admin Features
- **Centralized Management Dashboard**: A powerful, tab-based interface for managing the entire application.
- **User Management**: Full CRUD (Create, Read, Update, Delete) capabilities for both **Student** and **Teacher** accounts.
- **Academic Structure**: Admins can define the institution's structure by managing **Degrees**, **Streams**, and **Batches**.
- **Semester & Curriculum Management**: Ability to assign subjects, labs, and sections to students on a semester-by-semester basis.
- **Automated Report Generation**: Downloadable PDF reports for:
    - Complete Student Lists (with filtering)
    - Consolidated Grade Reports (SGPA/CGPA)
    - All Feedback Submissions
- **Feedback Viewer**: A dedicated portal to review all feedback submitted by students.

### 📚 Academic & Student Life Features
- **Virtual ID Card**: A dynamic, animated virtual ID card for all users, complete with a QR code and role-specific color schemes.
- **Assignment Tracker**: Teachers can create assignments, and students can track their due dates and status.
- **Attendance System**: Teachers and Admins can mark attendance and generate detailed attendance reports with visual progress bars.
- **Study Materials & Syllabus**: A structured, accordion-style repository for sharing and accessing course materials and syllabi.
- **Notice Board**: An elegant notice board where admins and teachers can post announcements, displayed as stylish cards.
- **Events Calendar**: A visually rich calendar for campus events, featuring animated cards and filtering options.
- **Important Portals**: A curated list of essential web links (e.g., scholarship portals, university websites) managed by the admin.
- **Student Circles**: Private, forum-style discussion groups for each class section, with posts, replies, and likes.
- **Faculty Directory (Mentor Connect)**: A searchable directory of all faculty members for students to connect with mentors.
- **Lost & Found Board**: An interactive board where users can report lost or found items, with support for direct camera uploads.
- **GPA/CGPA Calculator**: Students can view their semester-wise performance (SGPA) and their automatically calculated Cumulative GPA (CGPA).
- **Focus Session Timer**: A Pomodoro-style timer to help students manage study sessions and enhance productivity.
- **Anonymous Feedback System**: A form for students to provide valuable feedback on faculty and events, with an option for anonymity.

---

## 🚀 Getting Started

This guide will help you get a local copy of the project up and running for development and testing purposes.

### Prerequisites
- Node.js (v18 or later)
- npm or yarn
- A Firebase account

### Installation

1. **Clone the Repository**
   ```sh
   git clone https://github.com/your-username/mystudenthub.git
   cd mystudenthub
   ```

2. **Install Dependencies**
   ```sh
   npm install
   ```

3. **Set Up Firebase**
   - Create a new project on the [Firebase Console](https://console.firebase.google.com/).
   - In your project's settings, add a new Web App.
   - Copy the `firebaseConfig` object provided.
   - Create a file named `src/lib/firebase.ts` and paste your config:
     ```typescript
     import { initializeApp, getApps, getApp } from "firebase/app";
     import { getAuth } from "firebase/auth";
     import { getFirestore } from "firebase/firestore";

     const firebaseConfig = {
       // Your config object here
     };

     const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
     const auth = getAuth(app);
     const db = getFirestore(app);

     export { app, auth, db };
     ```
   - Enable **Email/Password** authentication in the Firebase Authentication console.
   - Create a **Firestore Database** in test mode to get started quickly. Remember to secure it with the rules provided in the app before going to production.

4. **Run the Development Server**
   ```sh
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 👨‍💻 About the Developer

This project was brought to life by **Subhasish Nayak (Team Nanites)**, a forward-thinking developer passionate about creating impactful and user-centric applications.

- **Portfolio**: [https://subhasish-nayak.onrender.com](https://subhasish-nayak.onrender.com)
- **LinkedIn**: [linkedin.com/in/your-profile](https://linkedin.com/in/your-profile)
- **GitHub**: [github.com/your-username](https://github.com/your-username)


This application serves as a testament to the synergy between human vision and AI-powered development, rapidly turning a complex idea into a tangible, high-quality product.
