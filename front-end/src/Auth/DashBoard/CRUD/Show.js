import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../Api/axios";

export default function Show(props) {
    const [items, setItems] = useState([]);
    const [del, setDel] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                let res = await api.get(`${props.endPoint}`)
                props.page === "users" && setItems(res.data.data)
                props.page === "students" && setItems(res.data.data)
                props.page === "courses" && setItems(res.data.data)
                props.page === "studyPlans" && setItems(res.data.data)
                props.page === "Programs" && setItems(res.data.data)   // dep
                props.page === "Specializations" && setItems(res.data.data)   // dep
                props.page === "AcademicYears" && setItems(res.data.data)
                props.page === "departments" && setItems(res.data)
                console.log(res.data.data)
            } catch (err) {
                console.log(err.response)
            }
        }
        fetchData()
    }, [del])
    console.log(items)

    async function deleteItem(id) {
        try {
            const res = await api.delete(`${props.endPoint}/${id}`)
            res.status === 200 && setDel((prev) => !prev)
        } catch (err) {
            console.log(err.response)
        }
    }

    const showItems = items.map((item, index) => (
        <tr key={index}>

            {props.page === "users" &&
                <>
                    <td>{index + 1}</td>
                    <td>{item.full_name}</td>
                    <td>{item.birth_date.split("T")[0]}</td>
                    <td>{item.email}</td>
                    <td>{item.type}</td>
                </>
            }


            {props.page === "students" &&
                <>
                    <td>{item.student_number}</td>
                    <td>{item.user.full_name}</td>
                    <td>{item.program.name}</td>
                    <td>{item.specialization && item.specialization.name}</td>
                    <td>{item.academic_records && item.academic_records[0].academic_year.name}</td>
                </>
            }

            {props.page === "courses" &&
                <>
                    <td>{item.name}</td>
                    <td>{item.credit_hours}</td>
                    <td>{item.is_active ? "True" : "False"}</td>
                </>
            }

            {props.page === "studyPlans" &&
                <>
                    <td>{item.name}</td>
                    <td>{item.program.name}</td>
                    <td>{item.specialization ? item.specialization.name : "Null"}</td>
                    <td>{item.study_year.name}</td>
                    <td>{item.semester_number}</td>
                    <td>{item.is_active ? "True" : "False"}</td>
                </>
            }

            {props.page === "departments" &&
                <>
                    <td>{item.description}</td>
                    <td>{item.manager_user ? item.manager_user.full_name : "None"}</td>
                </>
            }

            {props.page === "Employees" &&
                <>
                    <td>{item.user ? item.user.fName + " " + item.user.lName : "None"}</td>
                    <td>{item.department ? item.department.dep_name : "None"}</td>
                    <td>{item.salary ? item.salary : "0"}</td>
                </>
            }

            {props.page === "Programs" &&
                <>
                    <td>{item.name}</td>
                </>
            }

            {props.page === "Specializations" &&
                <>
                    <td>{item.name}</td>
                    <td>{item.program.name}</td>
                </>
            }

            {props.page === "AcademicYears" &&
                <>
                    <td>{item.name}</td>
                    <td>{item.is_current ? "Yes" : "NO"}</td>
                    <td>{item.is_closed ? "Yes" : "NO"}</td>
                </>
            }


            <td>
                <Link><i className="fa-solid fa-circle-info info"></i></Link>
                <Link to={`${item.id}`}><i className="fa-solid fa-pen-to-square pen"></i></Link>
                <i className="fa-solid fa-trash trash" onClick={() => deleteItem(item.id)}></i>
            </td>

        </tr>
    ))

    return (
        <div className="showItems">
            <div className="db-page-det">
                <h1>{props.pTitle}</h1>
                {props.page !== "Employees" & props.page !== "students" ? <Link to={`/auth/dashboard/${props.endPoint}/add`} className="button">Add {props.btn} +</Link> : null}
                {props.page === "studyPlans" ? <Link to={`/auth/dashboard/${props.endPoint}/add`} className="button">Assign Courses To Study Plan</Link> : null}
            </div>
            <table>
                <thead>
                    <tr>

                        {props.page === "users" &&
                            <>
                                <th>ID</th>
                                <th>Full Name</th>
                                <th>Birth Date</th>
                                <th>Email</th>
                                <th>Type</th>
                            </>
                        }

                        {props.page === "students" &&
                            <>
                                <th>Student Number</th>
                                <th>Student Name</th>
                                <th>Program</th>
                                <th>Specialization</th>
                                <th>Current Year</th>
                            </>
                        }

                        {props.page === "courses" &&
                            <>
                                <th>Name</th>
                                <th>Credit Hours</th>
                                <th>Is Active</th>
                            </>
                        }

                        {props.page === "studyPlans" &&
                            <>
                                <th>name</th>
                                <th>Program</th>
                                <th>Specializations</th>
                                <th>Study Year</th>
                                <th>Semseter</th>
                                <th>Is Active</th>
                            </>
                        }

                        {props.page === "departments" &&
                            <>
                                <th>Department Name</th>
                                <th>Manager</th>
                            </>
                        }


                        {props.page === "Employees" &&
                            <>
                                <th>Name</th>
                                <th>Department</th>
                                <th>Salary</th>
                            </>
                        }

                        {props.page === "Programs" &&
                            <>
                                <th>Name</th>
                            </>
                        }

                        {props.page === "Specializations" &&
                            <>
                                <th>Name</th>
                                <th>Program</th>
                            </>
                        }

                        {props.page === "AcademicYears" &&
                            <>
                                <th>Year</th>
                                <th>Is Current</th>
                                <th>Is Closed</th>
                            </>
                        }


                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {showItems}
                </tbody>
            </table>
        </div>
    )
}