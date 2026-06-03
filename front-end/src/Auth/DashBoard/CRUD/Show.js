import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../Api/axios";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function getSearchableText(value) {
    if (value === null || value === undefined) return "";

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }

    if (Array.isArray(value)) {
        return value.map((item) => getSearchableText(item)).join(" ");
    }

    if (typeof value === "object") {
        return Object.values(value).map((item) => getSearchableText(item)).join(" ");
    }

    return "";
}

export default function Show(props) {
    const [items, setItems] = useState([]);
    const [del, setDel] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

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
                props.page === "Employees" && setItems(res.data)
                props.page === "ShowAssignments" && setItems(res.data)
                props.page === "ClassSchedule" && setItems(res.data.data)

                console.log(res.data.data)
            } catch (err) {
                console.log(err.response)
            }
        }
        fetchData()
    }, [del])
    console.log(items)

    const filteredItems = useMemo(() => {
        const value = searchTerm.trim().toLowerCase();

        if (!value) return items;

        return items.filter((item) => getSearchableText(item).toLowerCase().includes(value));
    }, [items, searchTerm]);

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(filteredItems.length / pageSize));
    }, [filteredItems.length, pageSize]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, pageSize, props.page]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
    const startIndex = (safeCurrentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredItems.length);
    const paginatedItems = filteredItems.slice(startIndex, endIndex);

    async function deleteItem(id) {
        try {
            const res = await api.delete(`${props.endPoint}/${id}`)
            res.status === 200 && setDel((prev) => !prev)
        } catch (err) {
            console.log(err.response)
        }
    }

    const showItems = paginatedItems.map((item, index) => (
        <tr key={item.id || startIndex + index}>

            {props.page === "users" &&
                <>
                    <td>{startIndex + index + 1}</td>
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
                    <td>{item.user ? item.user.full_name : "None"}</td>
                    <td>{item.department ? item.department.name : "None"}</td>
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

            { props.page === "ShowAssignments" &&
                <>
                    <td>{item.doctor.user.full_name}</td>
                    <td>{item.course.name}</td>
                    <td>{item.academic_year.name}</td>
                    <td>{item.semester_number}</td>
                    <td>{item.is_primary ? "Yes" : "NO"}</td>
                </>
            }

            {
                props.page === "ClassSchedule" &&
                <>
                    <td>{item.name}</td>
                    <td>{item.is_active ? "Yes" : "No"}</td>
                </>
            }


            <td>
                <Link to="info"><i className="fa-solid fa-circle-info info"></i></Link>
                <Link to={`${item.id}`}><i className="fa-solid fa-pen-to-square pen"></i></Link>
                <i className="fa-solid fa-trash trash" onClick={() => deleteItem(item.id)}></i>
            </td>

        </tr>
    ))

    return (
        <div className="showItems">
            <div className="db-page-det">
                <h1>{props.pTitle}</h1>
                {props.page !== "Employees" & props.page !== "students" ? <Link to={`/auth/dashboard/${props.endPoint}/add`} className="button">إضافة {props.btn} +</Link> : null}
                {props.page === "studyPlans" ? <Link to={`/auth/dashboard/${props.endPoint}/add`} className="button">Assign Courses To Study Plan</Link> : null}
            </div>

            <div className="show-controls">
                <div className="show-search">
                    <i className="fa-solid fa-magnifying-glass"></i>
                    <input
                        type="search"
                        placeholder="Search in table..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="show-page-size">
                    <label>Rows</label>
                    <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                        {PAGE_SIZE_OPTIONS.map((option) => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="show-table-wrap">
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

                            {props.page === "ShowAssignments" && 
                                <>
                                    <th>Doctor</th>
                                    <th>Course</th>
                                    <th>Academic Year</th>
                                    <th>Semster</th>
                                    <th>Is Primary</th>
                                </>
                            }


                            {props.page === "ClassSchedule" && 
                                <>
                                    <th>Name</th>
                                    <th>Is Avtive</th>
                                </>
                            }


                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {showItems}
                        {!showItems.length &&
                            <tr>
                                <td className="show-empty" colSpan="10">No matching data found.</td>
                            </tr>
                        }
                    </tbody>
                </table>
            </div>

            <div className="show-pagination">
                <div className="show-pagination-info">
                    Showing <strong>{filteredItems.length ? startIndex + 1 : 0}</strong> to <strong>{endIndex}</strong> of <strong>{filteredItems.length}</strong>
                </div>

                <div className="show-pagination-actions">
                    <button type="button" disabled={safeCurrentPage === 1} onClick={() => setCurrentPage(1)}>First</button>
                    <button type="button" disabled={safeCurrentPage === 1} onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}>
                        <i className="fa-solid fa-chevron-left"></i>
                    </button>

                    <span>Page {safeCurrentPage} / {totalPages}</span>

                    <button type="button" disabled={safeCurrentPage === totalPages} onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}>
                        <i className="fa-solid fa-chevron-right"></i>
                    </button>
                    <button type="button" disabled={safeCurrentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>Last</button>
                </div>
            </div>
        </div>
    )
}
