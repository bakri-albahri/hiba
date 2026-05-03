import { useState } from "react";
import Add from "../CRUD/Add";
export default function AddStudyPan() {
    const [programs , setPrograms] = useState([])

    return (
        <div className="add_SudyPlan">
            <Add  page="addStudyPlan" endPoint="study-plans" pTitle="Study Plan" allBtn="Study Plans" />  
        </div>
    )

}