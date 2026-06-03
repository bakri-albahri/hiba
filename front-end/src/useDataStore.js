import { create } from 'zustand';
import axios from 'axios';
import api from './Auth/Api/axios';

const useDataStore = create((set) => ({
  courses: [],
  isLoadingCourses: false,
  fetchCourses: async () => {
    set({ isLoadingCourses: true });
    try {
      const res = await api.get('courses');
      set({ courses: res.data.data, isLoadingCourses: false });
    } catch (err) {
      set({ isLoadingCourses: false });
    }
  },


    schedById: [],
    isLoadingSchedById: false,
    fetchSchedById: async (id) => {
        set({ isLoadingSchedById: true });
        try {
            const res = await api.get(`/class-schedules/${id}`);
            set({ schedById: res.data, isLoadingSchedById: false });
        } catch (err) {
            set({ isLoadingSchedById: false });
        }
    },


  // جلب السنوات الاكاديمية
  acdYears: [],
  isLoadingStudyYears: false,
  fetchAcdYears: async () => {
    set({ isLoadingStudyYears: true });
    try {
      const res = await api.get('/academic-years');
      set({ acdYears: res.data, isLoadingStudyYears: false });
    } catch (err) {
      set({ isLoadingStudyYears: false });
    }
  },
  
  students: [],
  isLoadingStudents: false,
  fetchStudents: async () => {
    set({ isLoadingStudents: true });
    try {
      const res = await api.get('students');
      set({ students: res.data.data, isLoadingStudents: false });
    } catch (err) {
      set({ isLoadingStudents: false });
    }
  }
}));


export let days = [
    {
        id: "sunday" ,
        day : "الاحد"
    },
    {
        id: "monday" ,
        day : "الاثنين"
    },
    {
        id: "tuesday" ,
        day : "الثلاثاء"
    },
    {
        id: "wednesday" ,
        day : "الاربعاء"
    },
    {
        id: "thursday" ,
        day : "الخميس"
    },
    {
        id: "friday" ,
        day : "الجمعة"
    },
    {
        id: "saturday" ,
        day : "السبت"
    },
]

export default useDataStore;






















/* DELETE */
// import { create } from 'zustand';
// import axios from 'axios';

// const useDataStore = create((set) => ({
//   products: [],
//   users: [],
//   deletingIds: [], // مصفوفة لتخزين معرفات المنتجات الجاري حذفها

//   fetchProducts: async () => {
//     try {
//       const res = await axios.get('https://example.com');
//       set({ products: res.data });
//     } catch (err) { console.error(err); }
//   },

//   fetchUsers: async () => {
//     try {
//       const res = await axios.get('https://example.com');
//       set({ users: res.data });
//     } catch (err) { console.error(err); }
//   },

//   // دالة تفاعلية: حذف منتج مع إدارة حالة التحميل
//   deleteProduct: async (productId) => {
//     // إضافة المعرف لمصفوفة التحميل
//     set((state) => ({ deletingIds: [...state.deletingIds, productId] }));
    
//     try {
//       await axios.delete(`https://example.com/${productId}`);
//       // الحذف من الـ State وإزالته من مصفوفة التحميل
//       set((state) => ({
//         products: state.products.filter((p) => p.id !== productId),
//         deletingIds: state.deletingIds.filter((id) => id !== productId)
//       }));
//     } catch (err) {
//       console.error("فشل الحذف:", err);
//       // إزالته من مصفوفة التحميل في حال الفشل لإعادة تفعيل الزر
//       set((state) => ({ deletingIds: state.deletingIds.filter((id) => id !== productId) }));
//     }
//   },

//   // دالة تفاعلية: تعديل سعر المنتج
//   updateProductPrice: async (productId, newPrice) => {
//     try {
//       // 1. إرسال التعديل للسيرفر
//       await axios.put(`https://example.com/${productId}`, { price: newPrice });
      
//       // 2. تحديث السعر في الـ State فوراً
//       set((state) => ({
//         products: state.products.map((product) => 
//           product.id === productId ? { ...product, price: newPrice } : product
//         )
//       }));
//     } catch (err) {
//       console.error("فشل تعديل السعر:", err);
//     }
//   }
// }));

// export default useDataStore;









/* FROOOOOOOOOOOOOOOOONT */
// import { useEffect } from 'react';
// import useDataStore from './useDataStore';

// function AdminDashboard() {
//   const products = useDataStore((state) => state.products);
//   const users = useDataStore((state) => state.users);
//   const deletingIds = useDataStore((state) => state.deletingIds);
  
//   const fetchProducts = useDataStore((state) => state.fetchProducts);
//   const fetchUsers = useDataStore((state) => state.fetchUsers);
//   const deleteProduct = useDataStore((state) => state.deleteProduct);
//   const updateProductPrice = useDataStore((state) => state.updateProductPrice);

//   useEffect(() => {
//     if (products.length === 0) fetchProducts();
//     if (users.length === 0) fetchUsers();
//   }, [products, users, fetchProducts, fetchUsers]);

//   // معالج الحذف مع رسالة التأكيد
//   const handleDelete = (id, name) => {
//     const confirmDelete = window.confirm(`هل أنت متأكد من حذف المنتج: ${name}?`);
//     if (confirmDelete) {
//       deleteProduct(id);
//     }
//   };

//   // معالج التعديل
//   const handleEditPrice = (id, currentPrice) => {
//     const newPrice = window.prompt("أدخل السعر الجديد:", currentPrice);
//     // التأكد أن المستخدم أدخل قيمة ولم يضغط Cancel
//     if (newPrice !== null && newPrice.trim() !== "") {
//       updateProductPrice(id, Number(newPrice));
//     }
//   };

//   return (
//     <div style={{ padding: '20px', direction: 'rtl' }}>
//       <h1>لوحة التحكم المتقدمة</h1>
      
//       <table border="1" cellPadding="10" style={{ width: '100%', textAlign: 'right', borderCollapse: 'collapse' }}>
//         <thead>
//           <tr style={{ backgroundColor: '#f2f2f2' }}>
//             <th>اسم المنتج</th>
//             <th>السعر</th>
//             <th>المشتري</th>
//             <th>إجراءات</th>
//           </tr>
//         </thead>
//         <tbody>
//           {products.map((product) => {
//             const buyer = users.find((u) => u.id === product.userId);
//             // فحص هل المنتج يتم حذفه الآن؟
//             const isDeleting = deletingIds.includes(product.id);

//             return (
//               <tr key={product.id}>
//                 <td>{product.name}</td>
//                 <td>{product.price} $</td>
//                 <td>{buyer ? buyer.name : 'جاري التحميل...'}</td>
//                 <td>
//                   {/* زر التعديل */}
//                   <button 
//                     onClick={() => handleEditPrice(product.id, product.price)}
//                     style={{ marginLeft: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}
//                   >
//                     تعديل السعر
//                   </button>

//                   {/* زر الحذف مع مؤشر التحميل */}
//                   <button 
//                     onClick={() => handleDelete(product.id, product.name)}
//                     disabled={isDeleting}
//                     style={{ 
//                       backgroundColor: isDeleting ? '#ccc' : 'red', 
//                       color: 'white', 
//                       border: 'none', 
//                       padding: '5px 10px', 
//                       cursor: isDeleting ? 'not-allowed' : 'pointer' 
//                     }}
//                   >
//                     {isDeleting ? '⏳ جاري الحذف...' : '🗑️ حذف'}
//                   </button>
//                 </td>
//               </tr>
//             );
//           })}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// export default AdminDashboard;
