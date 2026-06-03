import { useEffect } from "react";
import useDataStore from "./useDataStore";

export default function Home() {
//     // استخراج البيانات والدالة من المخزن
//   const { items, isLoading, error, fetchItems } = useDataStore();

//   useEffect(() => {
//     // جلب البيانات فقط إذا كان المخزن فارغاً لتجنب التكرار
//     if (items.length === 0) {
//       fetchItems();
//     }
//   }, [items, fetchItems]);
    return (
        <div>
            Hello
        </div>
    )
}