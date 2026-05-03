import { useEffect, useState } from "react"
import api from "../../Api/axios"

export default function Grades(){
    const [grades , setGrades] = useState([])
    useEffect(() => {
        let getGrades = async () => {
            let res = await api.get(`students/1/grades`)
            // setGrades(res.data)
            console.log(res.data)
        }
        getGrades()
    },[])
    return(
        <div className="grades">
             <div className="db-page-det">
                {/* <h1>{props.pTitle}</h1> */}
                {/* {props.page !== "Employees" & props.page !== "students" ? <Link to={`/auth/dashboard/${props.endPoint}/add`} className="button">Add {props.btn} +</Link> : null}
                {props.page === "studyPlans" ? <Link to={`/auth/dashboard/${props.endPoint}/add`} className="button">Assign Courses To Study Plan</Link> : null} */}
            </div>
            hi
        </div>
    )
}