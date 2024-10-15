// استيراد وحدات Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, Timestamp, query, orderBy, deleteDoc, doc, writeBatch } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// إعدادات Firebase الخاصة بك
const firebaseConfig = {
    apiKey: "AIzaSyCmpiBFNmEm9BTaOWS5S7blm6hBm75yiOw",
    authDomain: "daily-bible-reading-6903b.firebaseapp.com",
    databaseURL: "https://daily-bible-reading-6903b-default-rtdb.firebaseio.com",
    projectId: "daily-bible-reading-6903b",
    storageBucket: "daily-bible-reading-6903b.appspot.com",
    messagingSenderId: "422582479606",
    appId: "1:422582479606:web:017168d5b9d2f23a8a9ad7",
    measurementId: "G-XEN3V1MB2Z"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// الحصول على اسم الصفحة الحالية
const currentPage = window.location.pathname.split("/").pop();

// دالة لعرض Toast الرسائل
function showToast(message, title = 'معلومات', type = 'info') {
    const toastHTML = `
        <div class="toast" role="alert" aria-live="assertive" aria-atomic="true" data-delay="3000">
            <div class="toast-header">
                <strong class="mr-auto">${title}</strong>
                <button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="إغلاق">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="toast-body bg-${type} text-white">
                ${message}
            </div>
        </div>
    `;
    $('body').append(toastHTML);
    $('.toast').toast('show');
    // إزالة Toast بعد انتهائه
    $('.toast').on('hidden.bs.toast', function () {
        $(this).remove();
    });
}

// 1. الصفحة الترحيبية (index.html)
if (currentPage === "index.html" || currentPage === "") {
    const nextBtn = document.getElementById('nextBtn');
    const adminBtn = document.getElementById('adminBtn');
    const adminLoginForm = document.getElementById('adminLoginForm');

    // عرض رسالة الترحيب
    $(document).ready(function(){
        $('#welcomeToast').toast('show');
    });

    nextBtn.addEventListener('click', async () => {
        const username = document.getElementById('username').value.trim();
        const grade = document.getElementById('grade').value;

        if (username === '' || grade === '') {
            showToast('من فضلك، أكمل جميع الحقول المطلوبة.', 'خطأ', 'danger');
            return;
        }

        // حفظ البيانات في localStorage
        localStorage.setItem('username', username);
        localStorage.setItem('grade', grade);

        // إضافة بيانات المستخدم إلى Firestore
        try {
            await addDoc(collection(db, 'users'), {
                username: username,
                grade: grade,
                completed: false,
                answers: {},
                timestamp: null
            });
        } catch (error) {
            console.error('Error adding document: ', error);
            showToast('حدث خطأ أثناء تسجيل المستخدم. حاول مرة أخرى.', 'خطأ', 'danger');
            return;
        }

        // الانتقال إلى صفحة الإصحاح
        window.location.href = 'chapter.html';
    });

    // التعامل مع تسجيل دخول المسؤول
    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // منع إعادة تحميل الصفحة
        const adminPassword = document.getElementById('adminPassword').value.trim();

        // التحقق من كلمة المرور (يجب تحسين الأمان في الإنتاج)
        const correctPassword = '123456'; // استبدلها بكلمة مرور آمنة ومشفرة

        if (adminPassword === correctPassword) {
            // إخفاء النموذج والانتقال إلى صفحة المسؤول
            $('#adminModal').modal('hide');
            window.location.href = 'admin.html';
        } else {
            showToast('كلمة المرور غير صحيحة. حاول مرة أخرى.', 'خطأ', 'danger');
        }
    });
}

// 2. صفحة الإصحاح اليومي (chapter.html)
if (currentPage === "chapter.html") {
    const chapterTitle = document.getElementById('chapter-title');
    const chapterContent = document.getElementById('chapter-content');
    const readBtn = document.getElementById('readBtn');

    // عرض رسالة إرشادية
    $(document).ready(function(){
        $('#chapterToast').toast('show');
    });

    // دالة لجلب الإصحاح اليومي
    async function fetchChapter() {
        try {
            const chaptersCol = collection(db, 'chapters');
            const chaptersSnapshot = await getDocs(chaptersCol);
            const chaptersList = chaptersSnapshot.docs.map(doc => doc.data());

            if (chaptersList.length === 0) {
                chapterContent.textContent = 'لا توجد إصحاحات متاحة.';
                return;
            }

            // حساب اليوم بناءً على تاريخ البدء
            const today = new Date();
            const startDate = new Date('2024-10-14'); // تاريخ البدء
            const diffTime = Math.abs(today - startDate);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            const chapterIndex = diffDays % chaptersList.length; // للتكرار إذا تجاوزت عدد الإصحاحات

            const todayChapter = chaptersList[chapterIndex];

            chapterTitle.textContent = todayChapter.title;
            chapterContent.textContent = todayChapter.content;
        } catch (error) {
            console.error('Error fetching chapters: ', error);
            chapterContent.textContent = 'حدث خطأ أثناء تحميل الإصحاح.';
        }
    }

    readBtn.addEventListener('click', () => {
        window.location.href = 'questions.html';
    });

    // تحميل الإصحاح عند تحميل الصفحة
    fetchChapter();
}

// 3. صفحة الأسئلة (questions.html)
if (currentPage === "questions.html") {
    const questionsForm = document.getElementById('questionsForm');
    const submitBtn = document.getElementById('submitBtn');
    const questionsToast = $('.toast');
    const username = localStorage.getItem('username');
    const grade = localStorage.getItem('grade');

    // عرض رسالة إرشادية
    $(document).ready(function(){
        $('#questionsToast').toast('show');
    });

    // دالة لجلب الأسئلة
    async function fetchQuestions() {
        try {
            const questionsCol = collection(db, 'questions');
            const questionsSnapshot = await getDocs(questionsCol);
            const questionsList = questionsSnapshot.docs.map(doc => doc.data());

            if (questionsList.length === 0) {
                questionsForm.innerHTML = '<p>لا توجد أسئلة متاحة حالياً.</p>';
                return;
            }

            // اختيار 3 أسئلة عشوائية
            const selectedQuestions = [];
            const usedIndices = new Set();

            while (selectedQuestions.length < 3 && usedIndices.size < questionsList.length) {
                const randomIndex = Math.floor(Math.random() * questionsList.length);
                if (!usedIndices.has(randomIndex)) {
                    usedIndices.add(randomIndex);
                    selectedQuestions.push(questionsList[randomIndex]);
                }
            }

            // إنشاء حقول الأسئلة
            selectedQuestions.forEach((q, index) => {
                const questionDiv = document.createElement('div');
                questionDiv.classList.add('form-group', 'animate__animated', 'animate__fadeInUp');

                const questionLabel = document.createElement('label');
                questionLabel.textContent = `❓ ${q.text}`;

                const answerInput = document.createElement('input');
                answerInput.type = 'text';
                answerInput.classList.add('form-control');
                answerInput.placeholder = 'اكتب إجابتك هنا';
                answerInput.required = true;
                answerInput.id = `answer-${index}`;

                questionDiv.appendChild(questionLabel);
                questionDiv.appendChild(answerInput);
                questionsForm.appendChild(questionDiv);
            });
        } catch (error) {
            console.error('Error fetching questions: ', error);
            questionsForm.innerHTML = '<p>حدث خطأ أثناء تحميل الأسئلة.</p>';
        }
    }

    submitBtn.addEventListener('click', async (e) => {
        e.preventDefault(); // منع إعادة تحميل الصفحة

        const answers = {};
        const inputs = questionsForm.querySelectorAll('input');

        for (let i = 0; i < inputs.length; i++) {
            const answer = inputs[i].value.trim();
            if (answer === '') {
                showToast('من فضلك، جاوب على كل الأسئلة.', 'خطأ', 'danger');
                return;
            }
            answers[`السؤال ${i + 1}`] = answer;
        }

        // التحقق من بيانات المستخدم
        if (!username || !grade) {
            showToast('حدث خطأ في بياناتك. حاول مرة أخرى.', 'خطأ', 'danger');
            return;
        }

        // حفظ الإجابات في Firestore
        try {
            await addDoc(collection(db, 'submissions'), {
                username: username,
                grade: grade,
                answers: answers,
                timestamp: Timestamp.now()
            });
            showToast(`شكراً يا ${username}! أتمنى لك يوم جميل. 😄`, 'نجاح', 'success');
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error submitting answers: ', error);
            showToast('حدث خطأ أثناء إرسال الإجابات. حاول مرة أخرى.', 'خطأ', 'danger');
        }
    });

    // تحميل الأسئلة عند تحميل الصفحة
    fetchQuestions();
}

// 4. صفحة المسؤولين (admin.html)
if (currentPage === "admin.html") {
    const reportsTableBody = document.querySelector('#reportsTableBody');
    const loadingSpinner = document.getElementById('loadingSpinner');

    // دالة لعرض Spinner
    function showSpinner() {
        loadingSpinner.style.display = 'block';
    }

    // دالة لإخفاء Spinner
    function hideSpinner() {
        loadingSpinner.style.display = 'none';
    }

    // دالة لجلب التقارير
    async function fetchSubmissions() {
        showSpinner(); // إظهار Spinner عند بدء جلب البيانات
        try {
            const submissionsCol = collection(db, 'submissions');
            const submissionsQuery = query(submissionsCol, orderBy('timestamp', 'desc')); // ترتيب من الأحدث إلى الأقدم
            const submissionsSnapshot = await getDocs(submissionsQuery);
            const submissionsList = submissionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (submissionsList.length === 0) {
                reportsTableBody.innerHTML = '<tr><td colspan="5">لا توجد تقارير لعرضها.</td></tr>';
            } else {
                reportsTableBody.innerHTML = ''; // تفريغ الجدول قبل إضافة البيانات
                submissionsList.forEach(submission => {
                    const row = document.createElement('tr');

                    const nameCell = document.createElement('td');
                    nameCell.textContent = submission.username || 'غير متوفر';

                    const gradeCell = document.createElement('td');
                    gradeCell.textContent = submission.grade || 'غير متوفر';

                    const answersCell = document.createElement('td');
                    if (submission.answers) {
                        Object.entries(submission.answers).forEach(([key, value]) => {
                            const p = document.createElement('p');
                            p.textContent = `${key}: ${value}`;
                            answersCell.appendChild(p);
                        });
                    } else {
                        answersCell.textContent = 'لا توجد إجابات.';
                    }

                    const timestampCell = document.createElement('td');
                    const date = submission.timestamp ? new Date(submission.timestamp.seconds * 1000).toLocaleString('ar-EG') : 'غير متوفر';
                    timestampCell.textContent = date;

                    const actionsCell = document.createElement('td');
                    const deleteBtn = document.createElement('button');
                    deleteBtn.classList.add('btn', 'btn-danger', 'btn-sm');
                    deleteBtn.textContent = 'حذف';
                    deleteBtn.addEventListener('click', () => deleteSubmission(submission.id));
                    actionsCell.appendChild(deleteBtn);

                    row.appendChild(nameCell);
                    row.appendChild(gradeCell);
                    row.appendChild(answersCell);
                    row.appendChild(timestampCell);
                    row.appendChild(actionsCell);

                    reportsTableBody.appendChild(row);
                });
            }
        } catch (error) {
            console.error('Error fetching submissions: ', error);
            reportsTableBody.innerHTML = '<tr><td colspan="5">حدث خطأ أثناء تحميل التقارير.</td></tr>';
        } finally {
            hideSpinner(); // إخفاء Spinner بعد انتهاء جلب البيانات
        }
    }

    // دالة لحذف تقرير
    async function deleteSubmission(id) {
        if (confirm('هل أنت متأكد من رغبتك في حذف هذا التقرير؟')) {
            try {
                await deleteDoc(doc(db, 'submissions', id));
                showToast('تم حذف التقرير بنجاح.', 'نجاح', 'success');
                fetchSubmissions(); // إعادة تحميل التقارير بعد الحذف
            } catch (error) {
                console.error('Error deleting submission:', error);
                showToast('حدث خطأ أثناء حذف التقرير.', 'خطأ', 'danger');
            }
        }
    }

    // دالة لمسح جميع التقارير
    async function clearAllSubmissions() {
        if (confirm('هل أنت متأكد أنك تريد مسح جميع التقارير؟')) {
            try {
                const submissionsCol = collection(db, 'submissions');
                const submissionsSnapshot = await getDocs(submissionsCol);
                const batch = writeBatch(db); // استخدام batch لحذف عدة مستندات

                submissionsSnapshot.docs.forEach(doc => {
                    batch.delete(doc.ref); // حذف كل مستند
                });

                await batch.commit(); // تنفيذ الحذف
                showToast('تم مسح جميع التقارير بنجاح.', 'نجاح', 'success');
                fetchSubmissions(); // إعادة تحميل التقارير
            } catch (error) {
                console.error('Error clearing submissions: ', error);
                showToast('حدث خطأ أثناء مسح التقارير.', 'خطأ', 'danger');
            }
        }
    }

    // ربط زر مسح جميع التقارير مع الدالة
    document.getElementById('clearReportsBtn').addEventListener('click', clearAllSubmissions);

    // تحميل التقارير عند تحميل الصفحة
    fetchSubmissions();
}


// ربط الزر مع الدالة
document.getElementById('clearReportsBtn').addEventListener('click', clearAllSubmissions);

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
            console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
            console.log('Service Worker registration failed:', error);
        });
    });
}
// التحقق مما إذا كانت الإشعارات مدعومة
if ('serviceWorker' in navigator && 'PushManager' in window) {
    navigator.serviceWorker.register('/service-worker.js')
    .then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope);
        return registration.pushManager.getSubscription()
            .then(async (subscription) => {
                if (subscription) {
                    console.log('Already subscribed:', subscription);
                    return subscription;
                }

                // طلب إذن الإشعارات
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    const vapidKey = 'BOvfShC64MW06emmVfsBI_SNFS8RgIRubSgs6u0BLbsiWFX9WcnDQwIw71NX7dBXtRyvTvrvu29chzEx9sc5qFc'; // أدخل مفتاح VAPID الخاص بك
                    return registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlB64ToUint8Array(vapidKey)
                    });
                } else {
                    console.log('Permission not granted for Notification');
                }
            });
    })
    .then((subscription) => {
        console.log('User is subscribed:', subscription);
        // أرسل الاشتراك إلى خادمك لتخزينه
    })
    .catch((error) => {
        console.error('Error during service worker registration:', error);
    });
}

// دالة لتحويل مفتاح VAPID من Base64 إلى Uint8Array
function urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // منع ظهور نافذة التثبيت الأصلية
    e.preventDefault();
    deferredPrompt = e; 
    document.getElementById('installBtn').style.display = 'block'; // إظهار زر التثبيت
});

document.getElementById('installBtn').addEventListener('click', () => {
    if (deferredPrompt) {
        deferredPrompt.prompt(); // إظهار نافذة التثبيت
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the A2HS prompt');
            } else {
                console.log('User dismissed the A2HS prompt');
            }
            deferredPrompt = null; // إعادة تعيين المتغير
        });
    }
});
