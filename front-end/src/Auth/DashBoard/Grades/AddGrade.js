import { useEffect, useState } from "react";
import useDataStore from "../../../useDataStore";
import Add from "../CRUD/Add";

export default function AddGrade(){
    const acdYears = useDataStore((state) => state.acdYears);
    const fetchAcdYears = useDataStore((state) => state.fetchAcdYears);
    const courses = useDataStore((state) => state.courses);
    const fetchCourses = useDataStore((state) => state.fetchCourses);
    console.log(courses)
    useEffect(() => {
        if (acdYears.length === 0 || courses === 0) {
            fetchAcdYears();
            fetchCourses();
        }
    }, [acdYears, fetchAcdYears]);

    const [stNum , setStNum] = useState()
    return(
        <div className="add-grade">
            <Add 
                page="addGrade" 
                endPoint="grades/quick-entry" 
                pTitle="Grade" allBtn="Grades"
                acdYears={acdYears?.data} 
                courses={courses}
            />  
        </div>
    )
}