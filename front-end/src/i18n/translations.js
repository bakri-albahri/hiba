export const SUPPORTED_LANGUAGES = {
  en: {
    code: "en",
    label: "English",
    shortLabel: "EN",
    dir: "ltr",
  },
  ar: {
    code: "ar",
    label: "العربية",
    shortLabel: "عربي",
    dir: "rtl",
  },
};

/*
  This dictionary is intentionally phrase-based because most of the current project
  text is hard-coded inside components. Add new phrases here whenever you add a new UI label.
*/
export const EN_TO_AR = {
  // Global

  "Document verification": "التحقق من الوثيقة",
  "Scan the QR code or open the verification page to confirm this document.": "امسح رمز QR أو افتح صفحة التحقق للتأكد من صحة الوثيقة.",
  "Verify document": "تحقق من الوثيقة",
  "Document verification QR code": "رمز QR للتحقق من الوثيقة",
  "Issued:": "تاريخ الإصدار:",
  "Portal Ref:": "مرجع البوابة:",
  "Document is valid and was issued by the student portal.": "الوثيقة صالحة وصادرة عن بوابة الطالب.",
  "Document exists but is not currently valid.": "الوثيقة موجودة لكنها غير صالحة حاليًا.",
  "Document verification code was not found.": "لم يتم العثور على رمز التحقق الخاص بالوثيقة.",
  "Dashboard": "لوحة التحكم",
  "DashBoard": "لوحة التحكم",
  "Admin Portal": "بوابة الإدارة",
  "Student Portal": "بوابة الطالب",
  "Doctor Portal": "بوابة الدكتور",
  "University Management System": "نظام إدارة الجامعة",
  "Admin Workspace": "مساحة عمل الإدارة",
  "Student Workspace": "مساحة الطالب",
  "Control Panel": "لوحة التحكم",
  "Refresh": "تحديث",
  "Refreshing": "جارِ التحديث",
  "Logout": "تسجيل الخروج",
  "Search": "بحث",
  "Search...": "بحث...",
  "Search in table...": "بحث ضمن الجدول...",
  "Search for a student...": "ابحث عن طالب...",
  "Serach For A Student...": "ابحث عن طالب...",
  "Loading": "جارِ التحميل",
  "Loading...": "جارِ التحميل...",
  "Saving...": "جارِ الحفظ...",
  "Submitting...": "جارِ الإرسال...",
  "Changing...": "جارِ التغيير...",
  "Try Again": "إعادة المحاولة",
  "Cancel": "إلغاء",
  "Close": "إغلاق",
  "Save": "حفظ",
  "Delete": "حذف",
  "Edit": "تعديل",
  "View": "عرض",
  "Details": "التفاصيل",
  "Action": "الإجراء",
  "Actions": "الإجراءات",
  "Status": "الحالة",
  "Notes": "ملاحظات",
  "Note": "ملاحظة",
  "No data": "لا توجد بيانات",
  "Not available": "غير متاح",
  "None": "لا يوجد",
  "True": "نعم",
  "False": "لا",
  "Yes": "نعم",
  "No": "لا",
  "NO": "لا",
  "Submit": "إرسال",
  "Print": "طباعة",
  "Export JSON": "تصدير JSON",
  "Rows": "الصفوف",
  "Rows per page": "عدد الصفوف",
  "First": "الأولى",
  "Last": "الأخيرة",
  "Page": "صفحة",
  "Showing": "عرض",
  "to": "إلى",
  "of": "من",

  // Sidebar / Dashboard
  "Users": "المستخدمون",
  "Students": "الطلاب",
  "Courses": "المقررات",
  "Study Plans": "الخطط الدراسية",
  "Departments": "الأقسام",
  "Grades": "العلامات",
  "Employees": "الموظفون",
  "Programs": "البرامج",
  "Specializations": "الاختصاصات",
  "Academic Years": "السنوات الأكاديمية",
  "Doctor Assignments": "تكليفات الدكاترة",
  "doctor course assignments": "تكليفات الدكاترة بالمقررات",
  "Class Schedule": "برنامج الدوام",
  "Reports": "التقارير",
  "Activity Logs": "سجل النشاط",
  "Employee Permissions": "صلاحيات الموظفين",
  "Overview": "نظرة عامة",

  // Student portal
  "View your academic status, grades, attendance, notifications, and submit student requests from one clear workspace.": "اعرض حالتك الأكاديمية، علاماتك، حضورك، إشعاراتك، وقدّم طلباتك من مساحة واحدة واضحة.",
  "Personal Information": "المعلومات الشخصية",
  "Academic Status": "الحالة الأكاديمية",
  "Full Name": "الاسم الكامل",
  "Father Name": "اسم الأب",
  "Mother Name": "اسم الأم",
  "Birth Date": "تاريخ الميلاد",
  "Birth Place": "مكان الميلاد",
  "Central Registry": "القيد المدني",
  "National ID": "الرقم الوطني",
  "Nationality": "الجنسية",
  "Gender": "الجنس",
  "Mobile": "الموبايل",
  "Phone Number": "رقم الهاتف",
  "Address": "العنوان",
  "Email": "البريد الإلكتروني",
  "Password": "كلمة المرور",
  "Current Password": "كلمة المرور الحالية",
  "New Password": "كلمة المرور الجديدة",
  "Confirm New Password": "تأكيد كلمة المرور الجديدة",
  "Change Password": "تغيير كلمة المرور",
  "Security Settings": "إعدادات الأمان",
  "Student Number": "رقم الطالب",
  "Program": "البرنامج",
  "Specialization": "الاختصاص",
  "Academic Year": "السنة الأكاديمية",
  "Study Year": "السنة الدراسية",
  "Registration": "التسجيل",
  "Academic Result": "النتيجة الأكاديمية",
  "Tuition Paid": "القسط مدفوع",
  "Annual Average": "المعدل السنوي",
  "Cumulative Average": "المعدل التراكمي",
  "Current academic year": "السنة الأكاديمية الحالية",
  "All recorded academic years": "جميع السنوات الأكاديمية المسجلة",
  "No recorded grades yet": "لا توجد علامات مسجلة بعد",
  "Notifications": "الإشعارات",
  "Objections": "الاعتراضات",
  "Supplementary": "التكميلي",
  "Attendance": "الحضور",
  "Security": "الأمان",
  "Carried Courses": "المواد المحمولة",
  "First Year": "السنة الأولى",
  "Second Year": "السنة الثانية",
  "Third Year": "السنة الثالثة",
  "Fourth Year": "السنة الرابعة",
  "Fifth Year": "السنة الخامسة",
  "Sixth Year": "السنة السادسة",
  "Course": "المقرر",
  "Code": "الرمز",
  "Coursework": "المذاكرة",
  "Practical": "المقابلة",
  "Exam": "الفحص",
  "Final": "النهائية",
  "Object": "اعتراض",
  "Coursework Mark": "علامة المذاكرة",
  "Practical Mark": "علامة المقابلة",
  "Exam Mark": "علامة الفحص",
  "Grade Objections": "اعتراضات العلامات",
  "Submit Grade Objection": "إرسال اعتراض على العلامة",
  "Objection Target": "نوع الاعتراض",
  "Objection Details": "تفاصيل الاعتراض",
  "Submit Objection": "إرسال الاعتراض",
  "Write the reason for the grade objection...": "اكتب سبب الاعتراض على العلامة...",
  "Supplementary Exam Registration": "التسجيل على الامتحان التكميلي",
  "My Supplementary Requests": "طلباتي للتكميلي",
  "Submit Supplementary Request": "إرسال طلب تكميلي",
  "Student Note": "ملاحظة الطالب",
  "Optional note for the exams department...": "ملاحظة اختيارية لقسم الامتحانات...",
  "Mark all as read": "تعيين الكل كمقروء",
  "Read": "مقروء",
  "No notifications": "لا توجد إشعارات",
  "You have no notifications at this time.": "لا توجد لديك إشعارات حاليًا.",
  "No grades available": "لا توجد علامات",
  "No grades were returned for your account yet.": "لم يتم جلب علامات لحسابك بعد.",
  "No carried courses": "لا توجد مواد محمولة",
  "You currently have no carried courses.": "لا توجد لديك مواد محمولة حاليًا.",
  "No schedule available": "لا يوجد برنامج دوام",
  "Your weekly class schedule is not available yet.": "برنامج دوامك الأسبوعي غير متاح بعد.",
  "No attendance records": "لا توجد سجلات حضور",
  "No attendance records were returned for your account.": "لم يتم جلب سجلات حضور لحسابك.",
  "No supplementary requests": "لا توجد طلبات تكميلي",
  "You have not submitted supplementary exam requests yet.": "لم تقم بإرسال طلبات تكميلي بعد.",
  "No grade objections": "لا توجد اعتراضات",
  "You have not submitted any grade objections yet.": "لم تقم بإرسال أي اعتراض على العلامات بعد.",
  "No eligible supplementary courses": "لا توجد مواد مؤهلة للتكميلي",
  "There are no courses currently eligible for supplementary exam registration.": "لا توجد مواد مؤهلة حاليًا للتسجيل على الامتحان التكميلي.",

  // Statuses
  "Pending": "قيد الانتظار",
  "Submitted": "مُرسل",
  "Approved": "مقبول",
  "Rejected": "مرفوض",
  "Supplementary Approved": "مقبول للتكميلي",
  "Registered": "مسجل",
  "Not Registered": "غير مسجل",
  "Stopped": "موقوف",
  "In Progress": "قيد المعالجة",
  "Passed": "ناجح",
  "Promoted": "مترفع",
  "Failed": "راسب",
  "Exhausted": "مستنفد",
  "Carried": "محمول",
  "Conditionally Passed": "ناجح شرطيًا",
  "Enrolled": "مسجل بالمقرر",
  "pending": "قيد الانتظار",
  "submitted": "مُرسل",
  "approved": "مقبول",
  "rejected": "مرفوض",
  "passed": "ناجح",
  "failed": "راسب",
  "carried": "محمول",
  "conditionally_passed": "ناجح شرطيًا",

  // Add / CRUD
  "Add User": "إضافة مستخدم",
  "Add Student": "إضافة طالب",
  "Add Course": "إضافة مقرر",
  "Add Department": "إضافة قسم",
  "Add Program": "إضافة برنامج",
  "Add Specialization": "إضافة اختصاص",
  "Add Study Plan": "إضافة خطة دراسية",
  "All Users": "كل المستخدمين",
  "All Students": "كل الطلاب",
  "All Courses": "كل المقررات",
  "All Departments": "كل الأقسام",
  "All Programs": "كل البرامج",
  "All Specializations": "كل الاختصاصات",
  "All Study Plans": "كل الخطط الدراسية",
  "Select Type": "اختر النوع",
  "Student": "طالب",
  "Employee": "موظف",
  "Doctor": "دكتور",
  "Select Program": "اختر البرنامج",
  "Select Specialization": "اختر الاختصاص",
  "Select Academic Year": "اختر السنة الأكاديمية",
  "Select Study Year": "اختر السنة الدراسية",
  "Select Department": "اختر القسم",
  "Select Course": "اختر المقرر",
  "Select Doctor": "اختر الدكتور",
  "Select Option": "اختر خيارًا",
  "Is Active": "فعّال",
  "Is Active ?": "هل هو فعال؟",
  "Credit Hours": "الساعات المعتمدة",
  "Course Name": "اسم المقرر",
  "Course Code": "رمز المقرر",
  "Course Description": "وصف المقرر",
  "Department Name": "اسم القسم",
  "Manager": "المدير",
  "Salary": "الراتب",
  "Job Title": "المسمى الوظيفي",
  "Hire Date": "تاريخ التعيين",

  // Login
  "Login": "تسجيل الدخول",
  "Sign In": "تسجيل الدخول",
  "Email Address": "البريد الإلكتروني",
  "Enter your email": "أدخل بريدك الإلكتروني",
  "Enter your password": "أدخل كلمة المرور",
  "Remember me": "تذكرني",
  // =========================================================
  // Full System Professional Arabic Translation Additions
  // =========================================================
  "Home": "الرئيسية",
  "Register": "إنشاء حساب",
  "Forgot password?": "هل نسيت كلمة المرور؟",
  "Don't have an account?": "ليس لديك حساب؟",
  "Log In": "تسجيل الدخول",
  "Email is required": "البريد الإلكتروني مطلوب",
  "Password is required": "كلمة المرور مطلوبة",
  "Invalid credentials": "بيانات الدخول غير صحيحة",
  "Preparing your workspace": "جارٍ تجهيز مساحة العمل الخاصة بك",
  "Preparing your academic workspace.": "جارٍ تجهيز مساحة الطالب الأكاديمية.",
  "Loading student portal...": "جارٍ تحميل بوابة الطالب...",
  "Unable to open student portal": "تعذر فتح بوابة الطالب",

  // General UI
  "Create": "إنشاء",
  "Update": "تحديث",
  "Reset": "إعادة ضبط",
  "Clear": "مسح",
  "Back": "رجوع",
  "Open": "فتح",
  "Download": "تحميل",
  "Download PDF": "تحميل PDF",
  "Upload": "رفع",
  "Attachment": "مرفق",
  "Attachments": "المرفقات",
  "File": "ملف",
  "Preview": "معاينة",
  "Filter": "تصفية",
  "Filters": "الفلاتر",
  "From": "من",
  "To": "إلى",
  "Date": "التاريخ",
  "Time": "الوقت",
  "Created At": "تاريخ الإنشاء",
  "Updated At": "تاريخ التحديث",
  "Description": "الوصف",
  "Message": "الرسالة",
  "Title": "العنوان",
  "Priority": "الأولوية",
  "Low": "منخفضة",
  "Normal": "عادية",
  "High": "عالية",
  "Limited": "مقيّد",
  "Available": "متاح",
  "Available services": "الخدمات المتاحة",
  "Need attention": "بحاجة متابعة",
  "Need processing": "بحاجة معالجة",
  "Download now": "تحميل فوري",
  "All": "الكل",
  "All statuses": "كل الحالات",
  "All groups": "كل المجموعات",
  "Other Permissions": "صلاحيات أخرى",
  "Selected": "محدد",
  "Selected Employee": "الموظف المحدد",
  "Selected Permissions": "الصلاحيات المحددة",
  "Available Permissions": "الصلاحيات المتاحة",
  "Permission Matrix": "مصفوفة الصلاحيات",
  "Select group": "تحديد المجموعة",
  "Clear group": "مسح المجموعة",
  "Clear All": "مسح الكل",
  "Save Changes": "حفظ التغييرات",
  "Saved successfully": "تم الحفظ بنجاح",
  "Created successfully": "تم الإنشاء بنجاح",
  "Updated successfully": "تم التحديث بنجاح",
  "Deleted successfully": "تم الحذف بنجاح",
  "Request failed": "فشل الطلب",
  "Request failed.": "فشل الطلب.",
  "This action is blocked by backend permissions.": "هذا الإجراء محظور بسبب صلاحيات النظام الخلفي.",
  "Endpoint or record was not found.": "المسار أو السجل غير موجود.",
  "Session expired. Please login again.": "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.",
  "This section is blocked by backend permissions.": "هذا القسم محظور بسبب صلاحيات النظام الخلفي.",

  // Dashboard / Admin
  "Admin Workspace": "مساحة عمل الإدارة",
  "Monitor users, students, academic structure, permissions, and operational reports from one control center.": "راقب المستخدمين والطلاب والبنية الأكاديمية والصلاحيات والتقارير التشغيلية من مركز تحكم واحد.",
  "Super Admin": "مدير النظام",
  "Control Panel": "لوحة التحكم",
  "Audit Center": "مركز التدقيق",
  "Access Control Center": "مركز التحكم بالوصول",
  "Dashboard Summary": "ملخص لوحة التحكم",
  "Financial Summary": "الملخص المالي",
  "Academic Summary": "الملخص الأكاديمي",
  "User Summary": "ملخص المستخدمين",
  "Department Summary": "ملخص الأقسام",
  "Student Report": "تقرير الطالب",
  "Department Report": "تقرير القسم",
  "System Reports": "تقارير النظام",
  "Operational Reports": "التقارير التشغيلية",
  "Generate Report": "توليد التقرير",
  "Export": "تصدير",
  "Export CSV": "تصدير CSV",
  "Export PDF": "تصدير PDF",
  "Print Report": "طباعة التقرير",

  // Entities and CRUD
  "User Details": "تفاصيل المستخدم",
  "All Users": "كل المستخدمين",
  "All Employees": "كل الموظفين",
  "All Doctors": "كل الدكاترة",
  "All Schedules": "كل الجداول",
  "Class Schedules": "برامج الدوام",
  "Add Class Schedule": "إضافة برنامج دوام",
  "Update Class Schedule": "تعديل برنامج الدوام",
  "Add Employee": "إضافة موظف",
  "Update Employee": "تعديل موظف",
  "Add Doctor": "إضافة دكتور",
  "Update Doctor": "تعديل دكتور",
  "Add Department": "إضافة قسم",
  "Update Department": "تعديل قسم",
  "Update Program": "تعديل برنامج",
  "Update Specialization": "تعديل اختصاص",
  "Update Student": "تعديل طالب",
  "Update Course": "تعديل مقرر",
  "Update Study Plan": "تعديل خطة دراسية",
  "Add Academic Year": "إضافة سنة أكاديمية",
  "Update Academic Year": "تعديل سنة أكاديمية",
  "Add Study Year": "إضافة سنة دراسية",
  "Update Study Year": "تعديل سنة دراسية",
  "Add Grade": "إضافة علامة",
  "Update Grade": "تعديل علامة",
  "Add Assignment": "إضافة تكليف",
  "Update Assignment": "تعديل تكليف",
  "Doctor Course Assignments": "تكليفات الدكاترة بالمقررات",
  "Assignment": "تكليف",
  "Assignments": "التكليفات",
  "User": "مستخدم",
  "Role": "الدور",
  "Type": "النوع",
  "Employee ID": "رقم الموظف",
  "User ID": "رقم المستخدم",
  "Department ID": "رقم القسم",
  "Student ID": "رقم الطالب",
  "Course ID": "رقم المقرر",
  "Program ID": "رقم البرنامج",
  "Specialization ID": "رقم الاختصاص",
  "Academic Year ID": "رقم السنة الأكاديمية",
  "Study Year ID": "رقم السنة الدراسية",
  "Dept Name": "اسم القسم",
  "Dept Code": "رمز القسم",
  "Department Code": "رمز القسم",
  "Program Name": "اسم البرنامج",
  "Specialization Name": "اسم الاختصاص",
  "Study Plan": "الخطة الدراسية",
  "Study Plan Course": "مقرر الخطة الدراسية",
  "Semester": "الفصل",
  "Semster": "الفصل",
  "Semester Number": "رقم الفصل",
  "Semester 1": "الفصل الأول",
  "Semester 2": "الفصل الثاني",
  "Course Information": "معلومات المقرر",
  "Course Details": "تفاصيل المقرر",
  "Schedule": "الجدول",
  "Day": "اليوم",
  "Room": "القاعة",
  "Hall": "القاعة",
  "Start Time": "وقت البداية",
  "End Time": "وقت النهاية",
  "Sunday": "الأحد",
  "Monday": "الإثنين",
  "Tuesday": "الثلاثاء",
  "Wednesday": "الأربعاء",
  "Thursday": "الخميس",
  "Friday": "الجمعة",
  "Saturday": "السبت",

  // Forms and validation
  "Father Name": "اسم الأب",
  "Mother Name": "اسم الأم",
  "Birth Date": "تاريخ الميلاد",
  "Birth Place": "مكان الولادة",
  "Central Registry": "القيد المدني",
  "Syrian": "سوري",
  "Not Syrian": "غير سوري",
  "Male": "ذكر",
  "Female": "أنثى",
  "Repeat Password": "تأكيد كلمة المرور",
  "Confirm Password": "تأكيد كلمة المرور",
  "Select Nationality": "اختر الجنسية",
  "Select Gender": "اختر الجنس",
  "Select Semster": "اختر الفصل",
  "Select Status": "اختر الحالة",
  "Select Employee": "اختر الموظف",
  "Select a student": "اختر طالبًا",
  "Select an employee": "اختر موظفًا",
  "Choose an employee from the list to review and update assigned permissions.": "اختر موظفًا من القائمة لمراجعة وتحديث الصلاحيات المسندة إليه.",
  "Loading employee details...": "جارٍ تحميل تفاصيل الموظف...",
  "No employees found.": "لم يتم العثور على موظفين.",
  "No permissions match your filters.": "لا توجد صلاحيات تطابق الفلاتر المحددة.",
  "Search permission...": "ابحث عن صلاحية...",
  "Search employee, email, job title...": "ابحث عن موظف أو بريد أو مسمى وظيفي...",
  "Search by action, user, entity, IP...": "ابحث حسب الإجراء أو المستخدم أو الكيان أو عنوان IP...",
  "created, updated, deleted...": "تم الإنشاء، تم التحديث، تم الحذف...",
  "User name or email": "اسم المستخدم أو البريد الإلكتروني",
  "Student, Course, User...": "طالب، مقرر، مستخدم...",
  "Name Is Required !": "الاسم مطلوب!",
  "Full Name Is Required !": "الاسم الكامل مطلوب!",
  "Father Name Is Required !": "اسم الأب مطلوب!",
  "Mother Name Is Required !": "اسم الأم مطلوب!",
  "Birth Date Is Required !": "تاريخ الميلاد مطلوب!",
  "Birth Place Is Required !": "مكان الولادة مطلوب!",
  "Central Registry Is Required !": "القيد المدني مطلوب!",
  "National ID Is Required !": "الرقم الوطني مطلوب!",
  "Type Is Required !": "النوع مطلوب!",
  "Phone Number Is Required !": "رقم الهاتف مطلوب!",
  "Address Is Required !": "العنوان مطلوب!",
  "email Is Required !": "البريد الإلكتروني مطلوب!",
  "Email Is Required !": "البريد الإلكتروني مطلوب!",
  "Password Is Required !": "كلمة المرور مطلوبة!",
  "Password Dosen't mutch": "كلمتا المرور غير متطابقتين",
  "Program Is Required !": "البرنامج مطلوب!",
  "Specialization Is Required !": "الاختصاص مطلوب!",
  "Academic Year Is Required !": "السنة الأكاديمية مطلوبة!",
  "Study Year Is Required !": "السنة الدراسية مطلوبة!",
  "Job Title Is Required !": "المسمى الوظيفي مطلوب!",
  "Department Is Required !": "القسم مطلوب!",
  "Hire Date Is Required !": "تاريخ التعيين مطلوب!",
  "Department Name Is Required !": "اسم القسم مطلوب!",
  "Department Code Is Required !": "رمز القسم مطلوب!",
  "Department Active Status Is Required !": "حالة تفعيل القسم مطلوبة!",
  "Course Is Required !": "المقرر مطلوب!",
  "Semester Is Required !": "الفصل مطلوب!",

  // Academic workflow
  "Academic Workflow": "سير العمل الأكاديمي",
  "Academic Workflow Audit Trail": "مسار تدقيق سير العمل الأكاديمي",
  "Year Closing": "إغلاق السنة",
  "Close Academic Year": "إغلاق السنة الأكاديمية",
  "Auto Promotion": "الترفيع التلقائي",
  "Auto Enroll": "التسجيل التلقائي",
  "Final Mark": "العلامة النهائية",
  "Coursework Mark": "علامة الأعمال",
  "Practical Mark": "علامة العملي",
  "Exam Mark": "علامة الامتحان",
  "Result": "النتيجة",
  "Target": "نوع الاعتراض",
  "Doctor Response": "رد الدكتور",
  "Final Decision": "القرار النهائي",
  "Sent to Doctor": "مرسل إلى الدكتور",
  "Doctor Responded": "تم رد الدكتور",
  "Rejected by Exams": "مرفوض من قسم الامتحانات",
  "Under Review": "قيد المراجعة",
  "Completed": "مكتمل",
  "Cancelled": "ملغى",
  "Closed": "مغلق",
  "Repeated": "معاد",
  "Allowed": "مسموح",
  "Blocked": "محظور",
  "Eligible": "مؤهل",
  "No limit": "لا يوجد حد",

  // Doctor portal
  "Doctor Workspace": "مساحة عمل الدكتور",
  "My Courses": "مقرراتي",
  "My Attendance": "حضوري",
  "Record Attendance": "تسجيل الحضور",
  "Attendance Records": "سجلات الحضور",
  "Attendance Requirements": "متطلبات الحضور",
  "Present": "حاضر",
  "Absent": "غائب",
  "Late": "متأخر",
  "Excused": "معذور",
  "Safe": "آمن",
  "Warning": "تحذير",
  "At Risk": "بحالة خطر",
  "No attendance records were returned for your account.": "لم يتم جلب سجلات حضور لحسابك.",

  // Departments portals
  "Finance": "المالية",
  "Finance Department": "القسم المالي",
  "Finance Workspace": "مساحة عمل المالية",
  "Student Affairs": "شؤون الطلاب",
  "Student Affairs Department": "قسم شؤون الطلاب",
  "Student Affairs Workspace": "مساحة عمل شؤون الطلاب",
  "Examinations Department": "قسم الامتحانات",
  "Examinations Workspace": "مساحة عمل الامتحانات",
  "Higher Studies": "الدراسات العليا",
  "Higher Studies Department": "قسم الدراسات العليا",
  "Higher Studies Workspace": "مساحة عمل الدراسات العليا",
  "Undergraduate Students": "طلاب الإجازة",
  "Postgraduate Students": "طلاب الدراسات العليا",
  "Postgraduate": "دراسات عليا",
  "Undergraduate": "إجازة جامعية",
  "Registration Status": "حالة التسجيل",
  "Registration status": "حالة التسجيل",
  "Tuition": "القسط",
  "Tuition Fee": "الرسوم الدراسية",
  "Tuition Payment": "دفع الرسوم",
  "Financial Clearance": "براءة مالية",
  "Payment Status": "حالة الدفع",
  "Payment History": "سجل الدفعات",
  "Receipt": "الإيصال",
  "Receipt Number": "رقم الإيصال",
  "Receipt Date": "تاريخ الإيصال",
  "Amount": "المبلغ",
  "Paid Amount": "المبلغ المدفوع",
  "Remaining Amount": "المبلغ المتبقي",
  "Paid": "مدفوع",
  "Unpaid": "غير مدفوع",
  "Financially Cleared": "مصفّى ماليًا",
  "Payment Required": "الدفع مطلوب",
  "Set Annual Tuition Fees": "تحديد الرسوم السنوية",
  "Update Tuition Payment Status": "تحديث حالة دفع الرسوم",
  "Send Student Notifications": "إرسال إشعارات للطلاب",

  // Reports / Activity Logs
  "Activity Logs": "سجل النشاط",
  "Activity Log Details": "تفاصيل سجل النشاط",
  "Total Logs": "إجمالي السجلات",
  "Create / Login": "إنشاء / دخول",
  "Updates": "التحديثات",
  "Risky / Delete": "خطر / حذف",
  "My Activity Logs": "سجلات نشاطي",
  "All Activity Logs": "كل سجلات النشاط",
  "No activity logs found.": "لم يتم العثور على سجلات نشاط.",
  "IP Address": "عنوان IP",
  "User Agent": "متصفح المستخدم",
  "Metadata": "البيانات الإضافية",
  "Description / Message": "الوصف / الرسالة",
  "Create": "إنشاء",
  "Login": "تسجيل الدخول",
  "Update": "تحديث",
  "Delete": "حذف",
  "General": "عام",
  "Entity": "الكيان",
  "Category": "الفئة",

  // Student Portal - new additions
  "My Profile": "ملفي الشخصي",
  "Plan Progress": "تقدم الخطة",
  "My Requests": "طلباتي",
  "Financial Status": "الحالة المالية",
  "Exam Card": "بطاقة الامتحان",
  "Exam Schedule": "جدول الامتحانات",
  "Academic Calendar": "التقويم الأكاديمي",
  "Documents": "الوثائق",
  "Settings": "الإعدادات",
  "Student Preferences": "تفضيلات الطالب",
  "Language": "اللغة",
  "Compact Mode": "الوضع المختصر",
  "Show Sensitive Financial Info": "إظهار المعلومات المالية الحساسة",
  "Notifications Enabled": "تفعيل الإشعارات",
  "Preferred Contact Method": "طريقة التواصل المفضلة",
  "Student File": "ملف الطالب",
  "Profile Completion": "اكتمال الملف",
  "Personal Details": "البيانات الشخصية",
  "Academic File": "الملف الأكاديمي",
  "Academic Documents": "الوثائق الأكاديمية",
  "Quick Student Services": "خدمات الطالب السريعة",
  "Request Update": "طلب تحديث",
  "Official Transcript / Grade Statement": "كشف علامات رسمي",
  "Unofficial Transcript": "كشف علامات غير رسمي",
  "Enrollment Certificate": "إثبات تسجيل",
  "Graduation Certificate": "شهادة تخرج",
  "University Clearance": "براءة ذمة جامعية",
  "Student Card Replacement": "بدل بطاقة جامعية",
  "Personal Information Update": "تحديث بيانات شخصية",
  "Financial Status Review": "مراجعة الحالة المالية",
  "Attendance Review": "مراجعة الحضور",
  "Official Attendance Statement": "بيان حضور رسمي",
  "Exam Absence Excuse": "عذر غياب عن امتحان",
  "Course Description Request": "طلب وصف مقرر",
  "Registration Status Review": "مراجعة حالة التسجيل",
  "Course Add Request": "طلب إضافة مادة",
  "Course Withdrawal Request": "طلب سحب مادة",
  "Major / Specialization Change": "طلب تغيير اختصاص",
  "Registration Suspension": "إيقاف تسجيل",
  "Registration Reactivation": "إعادة تفعيل التسجيل",
  "General Student Inquiry": "استفسار طلابي عام",
  "Service Request": "طلب خدمة",
  "Student service request": "طلب خدمة طلابية",
  "Submit Request": "إرسال الطلب",
  "Cancel Request": "إلغاء الطلب",
  "Request Type": "نوع الطلب",
  "Subject": "الموضوع",
  "Write a clear subject": "اكتب موضوعًا واضحًا",
  "Request Details": "تفاصيل الطلب",
  "Staff Response": "رد الموظف",
  "Official request workflow": "مسار طلب رسمي",
  "Instant student copy": "نسخة طلابية فورية",
  "Official Documents Center": "مركز الوثائق الرسمية",
  "Document Rules": "قواعد الوثائق",
  "Instant documents": "وثائق فورية",
  "Official documents": "وثائق رسمية",
  "Some official documents may require tuition clearance before final approval.": "قد تتطلب بعض الوثائق الرسمية تصفية مالية قبل الموافقة النهائية.",
  "Certified documents must be requested and reviewed by the responsible university office.": "يجب طلب الوثائق المصدّقة ومراجعتها من المكتب الجامعي المختص.",
  "Student-copy documents can be downloaded directly from the portal and are marked as generated copies.": "يمكن تحميل نسخ الطالب مباشرة من البوابة، ويتم تمييزها كنسخ مولدة إلكترونيًا.",
  "When needed, upload supporting files from the My Requests form after choosing the document service.": "عند الحاجة، يمكن رفع الملفات الداعمة من نموذج طلباتي بعد اختيار خدمة الوثيقة.",
  "Portal Ref": "مرجع البوابة",
  "EXAMINATIONS": "الامتحانات",
  "ACADEMIC": "أكاديمي",
  "ADMINISTRATIVE": "إداري",
  "Official Requests": "طلبات رسمية",
  "Instant": "فوري",
  "Request": "طلب",
  "Access instant student copies and submit official document requests from one organized center.": "احصل على نسخ طلابية فورية وقدّم طلبات الوثائق الرسمية من مركز واحد منظم.",

  // Calendar / deadlines
  "Upcoming": "القادمة",
  "Past": "السابقة",
  "Deadlines": "المواعيد المهمة",
  "Important Deadlines": "المواعيد المهمة",
  "Academic Events": "الأحداث الأكاديمية",
  "Financial Clearance Required": "مطلوب تصفية مالية",
  "Objection under review": "اعتراض قيد المراجعة",
  "Supplementary registration available": "التسجيل على التكميلي متاح",
  "Carried courses require attention": "المواد المحمولة تحتاج متابعة",
  "Unread notifications": "إشعارات غير مقروءة",
  "Service requests in progress": "طلبات خدمات قيد المعالجة",
  "Attendance needs review": "الحضور يحتاج مراجعة",
  "Everything is up to date": "كل شيء محدّث",
  "No urgent academic actions are required at this time.": "لا توجد إجراءات أكاديمية عاجلة مطلوبة حاليًا.",

  // Exam Card
  "Exam Card & Eligibility": "بطاقة الامتحان والأهلية",
  "Eligibility Checks": "فحص الأهلية",
  "Total Exams": "إجمالي الامتحانات",
  "Allowed": "مسموح",
  "Blocked": "محظور",
  "Tuition": "القسط",
  "Attendance": "الحضور",
  "Regular": "عادي",
  "Supplementary Exams": "الامتحانات التكميلية",
  "Supplementary exams appear only when the request is approved or completed.": "تظهر الامتحانات التكميلية فقط عندما يكون الطلب موافقًا عليه أو مكتملًا.",
  "Regular exams check attendance records against the required attendance count for each course.": "تتحقق الامتحانات العادية من سجلات الحضور مقارنة بالحد المطلوب لكل مقرر.",
  "Tuition payment is not cleared yet.": "لم يتم تسديد القسط بعد.",
  "Status: Registered": "الحالة: مسجل",
  "Exam card items": "بنود بطاقة الامتحان",
  "Eligible exams": "امتحانات مؤهل لها",
  "Need action": "بحاجة إجراء",
  "Financial clearance": "التصفية المالية",
  "This exam card is generated from the student portal based on the latest available academic, financial, attendance, and examination data.": "تم توليد بطاقة الامتحان من بوابة الطالب بناءً على أحدث البيانات الأكاديمية والمالية وبيانات الحضور والامتحانات المتاحة.",

  // Misc messages
  "No records found.": "لا توجد سجلات.",
  "No data available.": "لا توجد بيانات متاحة.",
  "No requests found.": "لا توجد طلبات.",
  "No results found.": "لا توجد نتائج.",
  "No schedule records found.": "لا توجد سجلات برنامج دوام.",
  "No payment history": "لا يوجد سجل دفعات",
  "No payment records were returned for your account.": "لم يتم جلب سجلات دفع لحسابك.",
  "No documents available": "لا توجد وثائق متاحة",
  "No academic calendar items": "لا توجد عناصر في التقويم الأكاديمي",
  "No exam card data": "لا توجد بيانات بطاقة امتحان",
  "No active service requests": "لا توجد طلبات خدمة نشطة",



  // =========================================================
  // Arabic polish patch v3 - Student Portal dynamic cards/sidebar
  // =========================================================
  "Academic Standing": "الوضع الأكاديمي",
  "Supplementary Opportunity": "فرصة امتحان تكميلي",
  "What should I do now?": "ماذا يجب أن أفعل الآن؟",
  "What should I do now": "ماذا يجب أن أفعل الآن؟",
  "?What should I do now": "ماذا يجب أن أفعل الآن؟",
  "?What should I do now?": "ماذا يجب أن أفعل الآن؟",
  "Supplementary registration available": "التسجيل على التكميلي متاح",
  "Unread notifications": "إشعارات غير مقروءة",
  "Financial status needs attention": "الحالة المالية تحتاج إلى متابعة",
  "Exam card has blocked exams": "توجد امتحانات محجوبة في البطاقة الامتحانية",
  "Exam card has blocked exam": "يوجد امتحان محجوب في البطاقة الامتحانية",
  "Attendance Risk Alert": "تنبيه خطر الحضور",
  "Finance": "المالية",
  "My Requests": "طلباتي",
  "Documents": "الوثائق",
  "Official Documents Center": "مركز الوثائق الرسمية",
  "Document Rules": "قواعد الوثائق",
  "Instant documents": "وثائق فورية",
  "Official documents": "وثائق رسمية",
  "Financial clearance": "براءة مالية",
  "Student-copy documents can be downloaded directly from the portal and are marked as generated copies.": "يمكن تحميل نسخ الطالب مباشرة من البوابة، وتظهر على أنها نسخ مولدة إلكترونيًا.",
  "Certified documents must be requested and reviewed by the responsible university office.": "يجب طلب الوثائق المصدقة ومراجعتها من قبل المكتب الجامعي المختص.",
  "Some official documents may require tuition clearance before final approval.": "قد تتطلب بعض الوثائق الرسمية تسوية مالية قبل الموافقة النهائية.",
  "When needed, upload supporting files from the My Requests form after choosing the document service.": "عند الحاجة، ارفع الملفات الداعمة من نموذج طلباتي بعد اختيار خدمة الوثيقة.",
  "Access instant student copies and submit official document requests from one organized center.": "يمكنك الوصول إلى نسخ الطالب الفورية وتقديم طلبات الوثائق الرسمية من مركز واحد منظم.",
  "Instant student copy": "نسخة طالب فورية",
  "Official request workflow": "مسار طلب رسمي",
  "Portal Ref": "مرجع البوابة",
  "Generated copy": "نسخة مولدة",
  "Need attention": "بحاجة متابعة",
  "Need processing": "قيد المعالجة",
  "Download now": "تحميل فوري",
  "Available services": "خدمات متاحة",
  "Exam Card": "بطاقة الامتحان",
  "Unofficial Transcript": "كشف علامات غير رسمي",
  "Official Transcript / Grade Statement": "كشف علامات رسمي",
  "Enrollment Certificate": "إثبات تسجيل",
  "Official Attendance Statement": "وثيقة حضور رسمية",
  "Course Description Request": "طلب توصيف مقرر",
  "Course Description": "توصيف المقرر",
  "University Clearance": "براءة ذمة جامعية",
  "Student Card Replacement": "بدل بطاقة جامعية",
  "Graduation Certificate": "شهادة تخرج",
  "Request an official proof of enrollment for the current academic year.": "اطلب إثبات تسجيل رسمي للسنة الأكاديمية الحالية.",
  "Submit an official request for a certified grade statement.": "قدّم طلبًا رسميًا للحصول على كشف علامات مصدق.",
  "Download a student-copy PDF of recorded grades from the portal.": "حمّل نسخة طالب PDF للعلامات المسجلة من البوابة.",
  "Download the latest exam card with eligibility checks and exam details.": "حمّل أحدث بطاقة امتحانية مع تحقق الأهلية وتفاصيل الامتحانات.",
  "Registration status is not fully registered yet.": "حالة التسجيل لم تكتمل بعد.",
  "Registration status is not fully registered yet": "حالة التسجيل لم تكتمل بعد",
  "Academic Calendar": "التقويم الأكاديمي",
  "Upcoming": "القادمة",
  "Past": "السابقة",
  "Deadlines": "المواعيد المهمة",
  "Upcoming Exams": "الامتحانات القادمة",
  "Calculated from the current academic year only.": "محسوب من السنة الأكاديمية الحالية فقط.",
  "Calculated from all recorded academic years.": "محسوب من جميع السنوات الأكاديمية المسجلة.",
  "Current academic year only": "السنة الأكاديمية الحالية فقط",
  "All recorded academic years": "جميع السنوات الأكاديمية المسجلة",
  "registered academic courses": "مقررات أكاديمية مسجلة",
  "Eligible exams": "امتحانات مسموحة",
  "Need action": "بحاجة إجراء",
  "Financial clearance": "براءة مالية",
  "Exam card items": "عناصر البطاقة الامتحانية",
  "Allowed": "مسموح",
  "Blocked": "محجوب",
  "Paid": "مدفوع",
  "Unpaid": "غير مدفوع",
  "Safe": "آمن",
  "Warning": "تحذير",
  "At Risk": "خطر",
  "Everything is up to date": "كل شيء محدث",
  "No urgent academic actions are required at this time.": "لا توجد إجراءات أكاديمية عاجلة مطلوبة حاليًا.",
  "No urgent academic actions are required at this time": "لا توجد إجراءات أكاديمية عاجلة مطلوبة حاليًا",
  "Review eligibility reasons before exam day.": "راجع أسباب الأهلية قبل يوم الامتحان.",
  "Review eligibility reasons before exam day": "راجع أسباب الأهلية قبل يوم الامتحان",
  "Your tuition or registration status may require review before completing student services.": "قد تحتاج حالة القسط أو التسجيل إلى مراجعة قبل إتمام خدمات الطالب.",
  "Your tuition or registration status may require review before completing student services": "قد تحتاج حالة القسط أو التسجيل إلى مراجعة قبل إتمام خدمات الطالب",
  "You have met the academic progression requirements for the current year.": "لقد حققت متطلبات الترفع الأكاديمي للسنة الحالية.",
  "You have met the academic progression requirements for the current year": "لقد حققت متطلبات الترفع الأكاديمي للسنة الحالية",
  "You were promoted with conditions. Please review your carried courses.": "تم ترفيعك بشروط. يرجى مراجعة المواد المحمولة.",
  "You did not meet the progression requirements. Please contact Student Affairs for guidance.": "لم تحقق متطلبات الترفع. يرجى مراجعة شؤون الطلاب للحصول على الإرشاد.",
  "Student Affairs": "شؤون الطلاب",
  "System Administrator": "مدير النظام",
  "Bachelor of Business Administration": "بكالوريوس إدارة الأعمال",
  "Financial Accounting": "المحاسبة المالية",
  "No limit": "لا يوجد حد",
  "Allowed exams": "امتحانات مسموحة",
  "Blocked exams": "امتحانات محجوبة",
  "Request Details": "تفاصيل الطلب",
  "Request details": "تفاصيل الطلب",
  "View Details": "عرض التفاصيل",
  "Ticket Timeline": "الخط الزمني للطلب",
  "Student Request Details": "تفاصيل طلب الطالب",
  "Administrative Response": "الرد الإداري",
  "Responsible Department": "القسم المسؤول",
  "Request Type": "نوع الطلب",
  "Submitted At": "تاريخ الإرسال",
  "Last Update": "آخر تحديث",
  "Priority": "الأولوية",
  "Student Service Request": "طلب خدمة طلابية",
  "Grade Objection": "اعتراض على علامة",
  "Supplementary Request": "طلب امتحان تكميلي",
  "Received by Department": "تم استلامه من القسم",
  "Under Review": "قيد المراجعة",
  "Final Decision": "القرار النهائي",
  "Awaiting Closure": "بانتظار الإغلاق",
  "Closed": "مغلق",
  "Cancelled": "ملغى",
  "Rejected": "مرفوض",
  "Approved": "مقبول",
  "Completed": "مكتمل",
  "Submitted": "مُرسل",
  "Pending": "قيد الانتظار",
  "Eligibility Review": "مراجعة الأهلية",
  "Sent to Doctor": "أُرسل إلى الدكتور",
  "Doctor Responded": "رد الدكتور",
  "Refreshing request details...": "جارِ تحديث تفاصيل الطلب...",
  "No request details provided.": "لم يتم إدخال تفاصيل للطلب.",
  "No administrative response has been added yet.": "لم تتم إضافة رد إداري بعد.",
  "No attachments were added to this request.": "لم تتم إضافة مرفقات لهذا الطلب.",
  "Attachments": "المرفقات",
  "View attachment": "عرض المرفق",
  "Reviewed by:": "تمت المراجعة بواسطة:",
  "Student Affairs Department": "قسم شؤون الطلاب",
  "Finance Department": "القسم المالي",
  "Examinations Department": "قسم الامتحانات",
  "Student Affairs / Documents Office": "شؤون الطلاب / مكتب الوثائق",
  "Graduation Eligibility": "أهلية التخرج",
  "Graduation requirements need review": "متطلبات التخرج تحتاج إلى مراجعة",
  "Review academic, financial, and registration requirements before graduation clearance.": "راجع المتطلبات الأكاديمية والمالية وحالة التسجيل قبل الحصول على براءة التخرج.",
  "Eligible": "مؤهل",
  "Needs review": "تحتاج مراجعة",
  "Current graduation status": "حالة التخرج الحالية",
  "Eligible for graduation": "مؤهل للتخرج",
  "Not eligible yet": "غير مؤهل بعد",
  "All graduation requirements are currently satisfied.": "جميع متطلبات التخرج مستوفاة حاليًا.",
  "Some graduation requirements still need attention.": "ما زالت بعض متطلبات التخرج تحتاج إلى متابعة.",
  "Study plan completion": "إنجاز الخطة الدراسية",
  "courses completed": "مواد منجزة",
  "Completed": "منجزة",
  "Remaining": "متبقية",
  "Need completion": "تحتاج إنجاز",
  "Retake attention": "تحتاج إعادة أو متابعة",
  "Credits": "الساعات",
  "Completed / total": "منجزة / إجمالي",
  "Graduation Checklist": "قائمة تحقق التخرج",
  "items": "بنود",
  "Open": "فتح",
  "All graduation checks passed": "تم اجتياز جميع شروط التخرج",
  "No pending academic, registration, or financial blockers were detected.": "لا توجد عوائق أكاديمية أو مالية أو إدارية معلقة.",
  "Remaining Academic Items": "البنود الأكاديمية المتبقية",
  "remaining": "متبقية",
  "No remaining courses": "لا توجد مواد متبقية",
  "The academic plan does not show remaining courses based on the current records.": "لا تظهر الخطة الأكاديمية أي مواد متبقية بناءً على السجلات الحالية.",
  "Academic completion": "استكمال الخطة الأكاديمية",
  "Financial clearance": "التسوية المالية",
  "Registration status": "حالة التسجيل",
  "Student standing": "وضع الطالب",
  "All known study plan courses are completed.": "جميع مواد الخطة المعروفة مكتملة.",
  "Some courses still need to be completed.": "ما زالت هناك مواد تحتاج إلى إنجاز.",
  "Tuition and registration financial records are cleared.": "السجلات المالية والتسجيلية مسددة ومكتملة.",
  "Financial clearance is not completed yet.": "التسوية المالية غير مكتملة بعد.",
  "Student registration is active and eligible.": "تسجيل الطالب فعال ومؤهل.",
  "Student registration or academic standing blocks graduation.": "حالة التسجيل أو الوضع الأكاديمي تمنع التخرج.",
  "Academic blockers": "عوائق أكاديمية",
  "Financial blocker": "عائق مالي",
  "Registration blocker": "عائق تسجيل",
  "Student has remaining, failed, carried, or in-progress courses.": "يوجد لدى الطالب مواد متبقية أو راسبة أو محمولة أو قيد الدراسة.",
  "Tuition payment or registration financial clearance is not completed.": "دفع الرسوم أو التسوية المالية للتسجيل غير مكتملة.",
  "Student registration is inactive or the student is exhausted.": "تسجيل الطالب غير فعال أو الطالب مستنفد.",

  // Course Materials
  "Course Materials": "مواد المقرر",
  "Access course descriptions, instructor information, and published learning resources for your enrolled courses.": "يمكنك الوصول إلى توصيف المقرر، معلومات المدرّس، والموارد التعليمية المنشورة للمواد المسجل عليها.",
  "Course descriptions": "توصيفات المقررات",
  "Descriptions are shown from the academic course record when available.": "يتم عرض توصيف المقرر من السجل الأكاديمي للمقرر عند توفره.",
  "Instructor assignment": "تكليف المدرّسين",
  "Doctors appear based on the course assignment for the current academic year.": "تظهر أسماء المدرّسين بناءً على تكليف المقرر في السنة الأكاديمية الحالية.",
  "Published resources": "الموارد المنشورة",
  "Files, links, videos, slides, notes, or assignments appear after they are published by the university.": "تظهر الملفات والروابط والفيديوهات والعروض والملاحظات والواجبات بعد نشرها من قبل الجامعة.",
  "Student access": "وصول الطالب",
  "Only materials for your enrolled courses are visible inside this portal.": "تظهر داخل هذه البوابة فقط مواد المقررات المسجل عليها الطالب.",
  "Materials Guide": "دليل مواد المقرر",
  "Enrolled courses": "المواد المسجلة",
  "Published resources": "الموارد المنشورة",
  "Courses with materials": "مواد لديها موارد",
  "Assigned instructors": "المدرّسون المكلفون",
  "With materials": "لديها مواد",
  "No materials yet": "لا توجد مواد بعد",
  "Current courses": "المواد الحالية",
  "Course instructors": "مدرّسو المقرر",
  "No instructor assignment is published for this course yet.": "لم يتم نشر تكليف مدرس لهذا المقرر بعد.",
  "Published materials": "المواد المنشورة",
  "No course materials have been published yet.": "لم يتم نشر أي مواد لهذا المقرر بعد.",
  "No course materials": "لا توجد مواد مقررات",
  "No enrolled courses or published resources are available for your current academic record.": "لا توجد مواد مسجلة أو موارد منشورة متاحة في سجلك الأكاديمي الحالي.",
  "Course material": "مادة مقرر",
  "No course description is available yet.": "لا يوجد توصيف متاح لهذا المقرر بعد.",
  "Study year": "السنة الدراسية",
  "Semester": "الفصل",
  "Credits": "الساعات",
  "Primary": "أساسي",
  "resources": "موارد",
  "Courses": "المواد",
  "Materials": "المواد التعليمية",
  "Ready": "جاهزة",
  "Doctors": "المدرّسون",

};

export const AR_TO_EN = Object.fromEntries(
  Object.entries(EN_TO_AR).map(([en, ar]) => [ar, en])
);

function preserveOuterSpaces(source, translated) {
  const start = String(source).match(/^\s*/)?.[0] || "";
  const end = String(source).match(/\s*$/)?.[0] || "";
  return `${start}${translated}${end}`;
}

function normalizeSpaces(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function lookupArabic(trimmed) {
  if (EN_TO_AR[trimmed]) return EN_TO_AR[trimmed];

  const normalized = normalizeSpaces(trimmed);
  if (EN_TO_AR[normalized]) return EN_TO_AR[normalized];

  const withoutTrailingColon = normalized.replace(/\s*[:：]\s*$/, "");
  if (withoutTrailingColon !== normalized && EN_TO_AR[withoutTrailingColon]) {
    return `${EN_TO_AR[withoutTrailingColon]}:`;
  }

  const withoutTrailingDots = normalized.replace(/\.\.\.$/, "");
  if (withoutTrailingDots !== normalized && EN_TO_AR[withoutTrailingDots]) {
    return `${EN_TO_AR[withoutTrailingDots]}...`;
  }

  const lowerMatch = Object.keys(EN_TO_AR).find((key) => key.toLowerCase() === normalized.toLowerCase());
  if (lowerMatch) return EN_TO_AR[lowerMatch];

  return null;
}

function lookupEnglish(trimmed) {
  if (AR_TO_EN[trimmed]) return AR_TO_EN[trimmed];
  const normalized = normalizeSpaces(trimmed);
  if (AR_TO_EN[normalized]) return AR_TO_EN[normalized];
  return null;
}

function translateEntity(value) {
  return lookupArabic(value) || value;
}

function translateDynamicToArabic(trimmed) {
  let match = trimmed.match(/^Welcome,\s*(.+)$/i);
  if (match) return `مرحباً، ${match[1]}`;

  match = trimmed.match(/^DashBoard\s*\/\s*(.+)$/i);
  if (match) return `لوحة التحكم / ${translateEntity(match[1])}`;

  match = trimmed.match(/^Add\s+(.+)$/i);
  if (match) return `إضافة ${translateEntity(match[1])}`;

  match = trimmed.match(/^Update\s+(.+)$/i);
  if (match) return `تعديل ${translateEntity(match[1])}`;

  match = trimmed.match(/^All\s+(.+)$/i);
  if (match) return `كل ${translateEntity(match[1])}`;

  match = trimmed.match(/^Select\s+(.+)$/i);
  if (match) return `اختر ${translateEntity(match[1])}`;

  match = trimmed.match(/^Loading\s+(.+?)\.\.\.$/i);
  if (match) return `جارٍ تحميل ${translateEntity(match[1])}...`;

  match = trimmed.match(/^Search\s+(.+?)\.\.\.$/i);
  if (match) return `ابحث عن ${translateEntity(match[1])}...`;

  match = trimmed.match(/^(.+?)\s+Is Required\s*!$/i);
  if (match) return `${translateEntity(match[1])} مطلوب!`;

  match = trimmed.match(/^No\s+(.+?)\s+found\.?$/i);
  if (match) return `لا توجد ${translateEntity(match[1])}.`;

  match = trimmed.match(/^No\s+(.+?)\s+available\.?$/i);
  if (match) return `لا يوجد ${translateEntity(match[1])} متاح.`;

  match = trimmed.match(/^(\d+)\s+of\s+(\d+)\s+selected$/i);
  if (match) return `${match[1]} من ${match[2]} محدد`;

  match = trimmed.match(/^(\d+)\s+courses?$/i);
  if (match) return `${match[1]} مقررات`;

  match = trimmed.match(/^(\d+)\s+requests?$/i);
  if (match) return `${match[1]} طلبات`;

  match = trimmed.match(/^(\d+)\s+records?$/i);
  if (match) return `${match[1]} سجلات`;

  match = trimmed.match(/^(\d+)\s+services?$/i);
  if (match) return `${match[1]} خدمات`;

  match = trimmed.match(/^(\d+)\s+unread$/i);
  if (match) return `${match[1]} غير مقروء`;

  match = trimmed.match(/^(\d+)\s+active$/i);
  if (match) return `${match[1]} نشط`;

  match = trimmed.match(/^(\d+)\s+passed\s*\/\s*(\d+)\s+failed$/i);
  if (match) return `${match[1]} ناجح / ${match[2]} راسب`;

  match = trimmed.match(/^(\d+)\s*\/\s*(\d+)\s+allowed$/i);
  if (match) return `${match[1]} / ${match[2]} مسموح`;

  match = trimmed.match(/^No grades for\s+(.+)$/i);
  if (match) return `لا توجد علامات لـ ${translateEntity(match[1])}`;

  match = trimmed.match(/^Course:\s*(.+)$/i);
  if (match) return `المقرر: ${match[1]}`;

  match = trimmed.match(/^Target:\s*(.+)$/i);
  if (match) return `نوع الاعتراض: ${translateEntity(match[1])}`;

  match = trimmed.match(/^Status:\s*(.+)$/i);
  if (match) return `الحالة: ${translateEntity(match[1])}`;

  match = trimmed.match(/^(.+?)\s+priority$/i);
  if (match) return `أولوية ${translateEntity(match[1])}`;

  // Student portal dynamic overview/actions
  match = trimmed.match(/^You have\s+(\d+)\s+courses?\s+eligible for supplementary exam registration\.?$/i);
  if (match) return `لديك ${match[1]} مواد مؤهلة للتسجيل على الامتحان التكميلي.`;

  match = trimmed.match(/^(\d+)\s+courses?\s+are eligible for supplementary exam registration\.?$/i);
  if (match) return `هناك ${match[1]} مواد مؤهلة للتسجيل على الامتحان التكميلي.`;

  match = trimmed.match(/^You have\s+(\d+)\s+unread notifications?\.?$/i);
  if (match) return `لديك ${match[1]} إشعارات غير مقروءة.`;

  match = trimmed.match(/^(\d+)\s+exams?\s+is currently blocked\.\s*Review eligibility reasons before exam day\.?$/i);
  if (match) return `يوجد ${match[1]} امتحان محجوب حاليًا. راجع أسباب الأهلية قبل يوم الامتحان.`;

  match = trimmed.match(/^(\d+)\s+exams?\s+are currently blocked\.\s*Review eligibility reasons before exam day\.?$/i);
  if (match) return `يوجد ${match[1]} امتحانات محجوبة حاليًا. راجع أسباب الأهلية قبل يوم الامتحان.`;

  match = trimmed.match(/^(\d+)\s+regular\s*\/\s*(\d+)\s+supplementary$/i);
  if (match) return `${match[1]} عادي / ${match[2]} تكميلي`;

  match = trimmed.match(/^(\d+)\s+services?\s+in progress$/i);
  if (match) return `${match[1]} طلبات قيد المعالجة`;

  match = trimmed.match(/^(\d+)\s+warnings?$/i);
  if (match) return `${match[1]} تحذير`;

  match = trimmed.match(/^(\d+)\s+warning$/i);
  if (match) return `${match[1]} تحذير`;

  match = trimmed.match(/^([\d.]+)\s+recorded academic years$/i);
  if (match) return `${match[1]} سنوات أكاديمية مسجلة`;

  return null;
}

function translateDynamicToEnglish(trimmed) {
  let match = trimmed.match(/^مرحباً،\s*(.+)$/);
  if (match) return `Welcome, ${match[1]}`;

  match = trimmed.match(/^لوحة التحكم\s*\/\s*(.+)$/);
  if (match) return `DashBoard / ${match[1]}`;

  return null;
}

function translateMixedPhraseToArabic(trimmed) {
  // Translate small composite labels such as "Student • Active" or "Course / Semester".
  const separators = [" • ", " | ", " / "];
  for (const separator of separators) {
    if (trimmed.includes(separator)) {
      const parts = trimmed.split(separator).map((part) => translatePlainText(part, "ar"));
      return parts.join(separator);
    }
  }
  return null;
}

export function translatePlainText(value, lang) {
  if (value === null || value === undefined) return value;
  const source = String(value);
  const trimmed = source.trim();

  if (!trimmed) return source;

  if (lang === "ar") {
    const exact = lookupArabic(trimmed);
    if (exact) return preserveOuterSpaces(source, exact);

    const dynamic = translateDynamicToArabic(trimmed);
    if (dynamic) return preserveOuterSpaces(source, dynamic);

    const mixed = translateMixedPhraseToArabic(trimmed);
    if (mixed && mixed !== trimmed) return preserveOuterSpaces(source, mixed);

    return source;
  }

  const exact = lookupEnglish(trimmed);
  if (exact) return preserveOuterSpaces(source, exact);

  const dynamic = translateDynamicToEnglish(trimmed);
  if (dynamic) return preserveOuterSpaces(source, dynamic);

  return source;
}

export function getLanguageMeta(lang) {
  return SUPPORTED_LANGUAGES[lang] || SUPPORTED_LANGUAGES.en;
}
