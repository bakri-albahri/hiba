import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../Api/axios";

function formatDateTime(value) {
  if (!value) return "غير متوفر";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString("ar-SY", {
      year: "numeric",
      month: "long",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

function StatusPill({ valid, status }) {
  return (
    <span className={`verify-status ${valid ? "valid" : "invalid"}`}>
      {valid ? "وثيقة صالحة" : status === "expired" ? "وثيقة منتهية" : "غير صالحة"}
    </span>
  );
}

export default function DocumentVerification() {
  const { code } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [documentData, setDocumentData] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(`document-verification/${encodeURIComponent(code || "")}`);
        if (!cancelled) setDocumentData(response.data);
      } catch (err) {
        if (!cancelled) {
          setDocumentData(err.response?.data || null);
          setError(err.response?.data?.message || "تعذر التحقق من الوثيقة.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, [code]);

  const metadataRows = useMemo(() => {
    const metadata = documentData?.metadata || {};
    return Object.entries(metadata).filter(([, value]) => value !== null && value !== undefined && value !== "");
  }, [documentData]);

  return (
    <main className="verify-page">
      <section className="verify-card">
        <div className="verify-brand">
          <div className="verify-brand-icon"><i className="fa-solid fa-shield-halved"></i></div>
          <div>
            <p>نظام إدارة الجامعة</p>
            <h1>التحقق من الوثائق</h1>
          </div>
        </div>

        {loading ? (
          <div className="verify-loading">جاري التحقق من رمز الوثيقة...</div>
        ) : (
          <>
            <div className="verify-result-header">
              <StatusPill valid={documentData?.valid} status={documentData?.status} />
              <span className="verify-code" data-i18n-skip="true">{documentData?.verification_code || code}</span>
            </div>

            {error && !documentData?.valid ? (
              <div className="verify-error">
                <i className="fa-solid fa-circle-exclamation"></i>
                <p>{error}</p>
              </div>
            ) : null}

            {documentData?.verification_code ? (
              <div className="verify-info-grid">
                <div className="verify-info-item">
                  <span>نوع الوثيقة</span>
                  <strong>{documentData.document_title || documentData.document_type || "وثيقة طالب"}</strong>
                </div>
                <div className="verify-info-item">
                  <span>اسم الطالب</span>
                  <strong>{documentData.student?.full_name || "غير متوفر"}</strong>
                </div>
                <div className="verify-info-item">
                  <span>الرقم الجامعي</span>
                  <strong data-i18n-skip="true">{documentData.student?.student_number || "غير متوفر"}</strong>
                </div>
                <div className="verify-info-item">
                  <span>البرنامج</span>
                  <strong>{documentData.student?.program_name || "غير متوفر"}</strong>
                </div>
                <div className="verify-info-item">
                  <span>السنة الأكاديمية</span>
                  <strong>{documentData.academic_year || "غير متوفر"}</strong>
                </div>
                <div className="verify-info-item">
                  <span>تاريخ الإصدار</span>
                  <strong>{formatDateTime(documentData.issued_at)}</strong>
                </div>
                <div className="verify-info-item">
                  <span>تاريخ الانتهاء</span>
                  <strong>{formatDateTime(documentData.expires_at)}</strong>
                </div>
                <div className="verify-info-item">
                  <span>حالة الوثيقة</span>
                  <strong>{documentData.valid ? "صالحة للاستخدام" : "غير صالحة حاليًا"}</strong>
                </div>
              </div>
            ) : null}

            {metadataRows.length ? (
              <div className="verify-metadata">
                <h2>تفاصيل إضافية</h2>
                {metadataRows.map(([key, value]) => (
                  <div className="verify-meta-row" key={key}>
                    <span>{key.replaceAll("_", " ")}</span>
                    <strong>{String(value)}</strong>
                  </div>
                ))}
              </div>
            ) : null}

            <p className="verify-note">
              تظهر هذه الصفحة نتيجة التحقق من رمز الوثيقة الصادر عن بوابة الطالب. في حال وجود أي تعارض، يرجى مراجعة شؤون الطلاب.
            </p>
          </>
        )}

        <Link className="verify-back-link" to="/login">العودة إلى تسجيل الدخول</Link>
      </section>
    </main>
  );
}
