import './ud.css'
export default function UserDetails(){
    return(
        <div className="profile-container">
        {/* <!-- البطاقة الجانبية للملف الشخصي --> */}
        <aside className="profile-card">
            <div className="profile-image">
                <img src="https://via.placeholder.com" alt="صورة المستخدم" />
            </div>
            <h2>أحمد الهاشمي</h2>
            <p className="role">مطور واجهات أمامية</p>
            <div className="stats">
                <div><strong>150</strong><span>مشاريع</span></div>
                <div><strong>2.4k</strong><span>متابعين</span></div>
            </div>
            <button className="btn-primary">تعديل البيانات</button>
        </aside>

        {/* <!-- قسم المعلومات التفصيلية --> */}
        <main className="details-section">
            <section className="info-card">
                <h3>المعلومات الشخصية</h3>
                <div className="info-grid">
                    <div className="info-item"><label>الاسم الكامل</label><p>أحمد محمد الهاشمي</p></div>
                    <div className="info-item"><label>البريد الإلكتروني</label><p>ahmed@example.com</p></div>
                    <div className="info-item"><label>رقم الهاتف</label><p>+966 50 123 4567</p></div>
                    <div className="info-item"><label>الموقع</label><p>الرياض، السعودية</p></div>
                </div>
            </section>

            <section className="info-card">
                <h3>إعدادات الحساب</h3>
                <div className="info-grid">
                    <div className="info-item"><label>اسم المستخدم</label><p>ahmed_dev</p></div>
                    <div className="info-item"><label>تاريخ الانضمام</label><p>يناير 2023</p></div>
                    <div className="info-item"><label>حالة الحساب</label><p><span className="status-active">نشط</span></p></div>
                </div>
            </section>
        </main>
    </div>
    )
}