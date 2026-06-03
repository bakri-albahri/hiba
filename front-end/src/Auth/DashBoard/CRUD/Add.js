import { useEffect, useState } from "react"
import { Link } from "react-router-dom";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/airbnb.css";
// import "flatpickr/dist/themes/material_blue.css";
// import "flatpickr/dist/themes/dark.css";

import api from "../../Api/axios";
import Semster from "../../Components/input/Semster";
import Name from "../../Components/input/Input";
import IsActive from "../../Components/input/IsActive";
import Select from "../../Components/input/Select";
import Inputs from "../../Components/input/Input";

function getServerErrorMessage(err) {
    const data = err?.response?.data;

    if (!data) {
        return err?.message || "Something went wrong while sending the request.";
    }

    if (typeof data === "string") {
        return data;
    }

    if (data.message) {
        return data.message;
    }

    if (data.error) {
        return data.error;
    }

    if (data.errors && typeof data.errors === "object") {
        return Object.values(data.errors)
            .flat()
            .filter(Boolean)
            .join(" ");
    }

    return "The server rejected the request. Please review the entered data.";
}

export default function Add(props) {

    const [name, setName] = useState("")




    // Main State
    const [accept, setAccept] = useState(false);
    const [selectedValue, setSelectedValue] = useState("");
    const [isActive, setIsActive] = useState("");
    const [currentProgram, setCurrentProgram] = useState("")
    const [programSpecs, setProgramSpecs] = useState([])
    const [currentSpec, setCurrentSpec] = useState("")
    const [semsterNum, setSemsterNum] = useState("")
    const [acdYears, setAcdYears] = useState([])
    const [selectedAcdYear, setSelectedAcdYear] = useState()
    const [years, setYears] = useState("")
    const [level, setLevel] = useState("")
    const [stNum , setStNum] = useState()
    const [mark , setMark] = useState()
    const [gradeType , setGradeType] = useState("")

    // Add user State
    const [fName, setFName] = useState("");
    const [fatherName, setFatherName] = useState("");
    const [motherName, setMotherName] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [birthPlace, setBirthPlace] = useState("");
    const [centralRegistry, setCentralRegistry] = useState("");
    const [nationalId, setNationalId] = useState("");
    const [nationality, setNationality] = useState("");
    const [gender, setGender] = useState("");
    const [mobile, setMobile] = useState("");
    const [address, setAddress] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rePassword, setRePassword] = useState("");
    const [type, setType] = useState("");

    // User Type Student State

    const [currentAcdYear, setCurrentAcdYear] = useState("")


    const [programs, setPrograms] = useState([])

    const [studyYears, setStudyYears] = useState([])
    const [currentStudyYear, setCurrentStudyYear] = useState("")

    // User Type Employee State
    const [jobTitle, setJobTite] = useState("")
    const [selectedDept, setSelectedDept] = useState("");
    const [hireDate, setHireDate] = useState("");
    const [departments, setDepartments] = useState([])


    // Add Dept State
    const [depName, setDepName] = useState('');
    const [depCode, setDepCode] = useState('');
    const [depDesc, setDepDesc] = useState('');
    const [currentManager, setCurrentManager] = useState('');


    // Add Course State
    const [corCode, setCorCode] = useState("")
    const [coName, setCoName] = useState("")
    const [creditHours, setCreditHours] = useState("")
    const [corDesc, setCorDesc] = useState("")

    // Emp State
    const [salary, setSalary] = useState(Number);

    // Add Program State
    const [progName, setProgName] = useState('');

    // Add Specialization State
    const [specName, setSpecName] = useState('');


    // Add Assignments
    const [doctors, setDoctors] = useState([])
    const [courses, setCourses] = useState([])
    const [selectedCourse, setSelectedCourse] = useState()
    const [isPrimary, setIsPrimary] = useState()
    const [addToast, setAddToast] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    let dataToAdd = {}

    // Get Programs 
    useEffect(() => {
        if (type === "student" || props.page === "addStudyPlan" || props.page === "AddSchedule") {
            let fetchData = async () => {
                let res = await api.get('programs')
                setPrograms(res.data.data)
                console.log(res.data.data)
            }
            fetchData()
        }
        if (props.page === "add-assignment") {
            let fetchData = async () => {
                console.log("first")
                let docRes = await api.get('doctors')
                let corRes = await api.get('courses')
                let acdYearRes = await api.get('academic-years')
                setDoctors(docRes.data)
                setCourses(corRes.data.data)
                setAcdYears(acdYearRes.data.data)
                console.log(docRes)
                console.log(acdYearRes.data.data)
            }
            fetchData()
        }
        // if(currentProgram || props.page === "AddSchedule"){

        // }

    }, [type])

    // Get Current Selected Program Specializations
    useEffect(() => {
        if (currentProgram) {
            let fetchData = async () => {
                let getPrograms = await api.get(`programs/${currentProgram}`)
                setProgramSpecs(getPrograms.data.specializations)
                let getAcademicYears = await api.get(`academic-years`)
                setAcdYears(getAcademicYears.data.data)
                let getStudyYears = await api.get(`study-years`)
                setStudyYears(getStudyYears.data.data)

            }
            fetchData()
        }
    }, [currentProgram])

    // Get Departments 
    useEffect(() => {
        if (type === "employee") {
            let fetchData = async () => {
                let res = await api.get('departments')
                setDepartments(res.data)
            }
            fetchData()
        }

    }, [type])

    async function submit(e) {
        let flag = true;
        let readyToSend = false;
        e.preventDefault();
        setAccept(true)
        setAddToast(null)

        // Add Data To States

        if (props.page === "addUser") {

            if (
                fName === "" || fatherName === "" || motherName === "" || email === ""
                || birthDate === "" || birthPlace === "" || nationalId === "" || gender === ""
                || centralRegistry === "" || nationality === "" || mobile === ""
                || address === "" || password === "" || type === "" || password !== rePassword || password.length < 8
            ) {
                flag = false
            } else if (type === "student" && (currentProgram === "" || currentAcdYear === "" || currentStudyYear === "")) {
                flag = false
            } else if (type === "student" && currentStudyYear > 3 & currentSpec === "" || currentSpec === "none") {
                flag = false
            } else if (type === "employee" && (jobTitle === "" || selectedDept === "")) {
                flag = false
                console.log(flag)
            } else if (flag) {
                console.log(flag)
                dataToAdd = {
                    full_name: fName,
                    father_name: fatherName,
                    mother_name: motherName,
                    birth_date: birthDate,
                    birth_place: birthPlace,
                    central_registry: centralRegistry,
                    national_id: nationalId,
                    nationality: nationality,
                    gender: gender,
                    mobile: mobile,
                    address: address,
                    email: email,
                    password: password,
                    type: type,
                }

                if (type === "student") {
                    dataToAdd = {
                        ...dataToAdd,
                        program_id: currentProgram,
                        specialization_id: currentSpec,
                        academic_year_id: currentAcdYear,
                        study_year_id: currentStudyYear,
                    }
                }

                if (type === "employee") {
                    dataToAdd = {
                        ...dataToAdd,
                        department_id: selectedDept,
                        job_title: jobTitle,
                        hire_date: hireDate,
                    }
                }
                readyToSend = true;
            }

        } else if (props.page === "addDept") {

            if (depName === "" || depCode === "" || depDesc === "" || isActive === "") {
                flag = false
            } else if (flag) {
                dataToAdd = {
                    name: depName,
                    code: depCode,
                    description: depDesc,
                    manager_user_id: currentManager,
                    is_active: isActive,
                }
                readyToSend = true;
            }

        } else if (props.page === "addCourse") {
            if (corCode === "" || coName === "" || creditHours === "" || corDesc === "") {
                flag = false
            } else if (flag) {
                dataToAdd = {
                    code: corCode,
                    name: coName,
                    credit_hours: creditHours,
                    description: corDesc,
                    is_active: isActive,
                }
                readyToSend = true;
            }
        } else if (props.page === "addSpec") {
            if (!name || selectedValue === "") {
                flag = false
            } else if (flag) {
                dataToAdd = {
                    name: name,
                    program_id: selectedValue
                }
                readyToSend = true
            }
        } else if (props.page === "addStudyPlan") {
            if (!name || !currentProgram || !currentStudyYear || !semsterNum || !isActive) {
                flag = false
            } else if (flag) {
                dataToAdd = {
                    program_id: currentProgram,
                    specialization_id: currentSpec,
                    study_year_id: currentStudyYear,
                    semester_number: semsterNum,
                    name: name,
                    is_active: isActive,
                    notes: "",
                }
                readyToSend = true;
            }
        } else if (props.page === "addProg") {
            console.log("first")
            if (!name || !years || years === 0 || !level) {
                flag = false
                console.log("false")
            } else {
                dataToAdd = {
                    name: name,
                    total_years: years,
                    level: level
                }
                readyToSend = true;
                console.log("True")
            }
        } else if (props.page === "add-assignment") {
            if (!selectedValue || !selectedCourse || !selectedAcdYear || !semsterNum || isPrimary === "") {
                flag = false
            } else {
                dataToAdd = {
                    "doctor_id": selectedValue,
                    "course_id": selectedCourse,
                    "academic_year_id": selectedAcdYear,
                    "semester_number": semsterNum,
                    "is_primary": isPrimary
                }
                readyToSend = true;
            }
        } else if (props.page === "AddSchedule") {
            if (!name || !currentProgram || !currentStudyYear || !semsterNum || !isActive) {
                flag = false
            } else {
                dataToAdd = {
                    "program_id": currentProgram,
                    "study_year_id": currentStudyYear,
                    "specialization_id": currentSpec,
                    "semester_number": semsterNum,
                    "name": name,
                    "is_active": isActive
                }
                readyToSend = true;
            }
        } else if (props.page === "addGrade"){
            if(!currentAcdYear || !selectedValue || !gradeType || !mark || !stNum){
                flag = false
            } else {
                dataToAdd = {
                    "academic_year_id": currentAcdYear,
                    "student_number": stNum,
                    "course_code": selectedValue,
                    [gradeType]: mark
                }
                readyToSend = true;
            }
        }else {
            flag = true
            readyToSend = true
        };
        if (!readyToSend) {
            setAddToast({
                type: "error",
                title: "Missing or invalid information",
                message: "Please review the highlighted fields and complete the required data before submitting.",
            });
            return;
        }

        try {
            setIsSubmitting(true)
            let res = await api.post(`/${props.endPoint}/`, dataToAdd)
            console.log(res)
            if (res.status === 201) {
                setAddToast({
                    type: "success",
                    title: "Saved successfully",
                    message: `${props.pTitle} has been added successfully.`,
                });

                setTimeout(() => {
                    window.location.pathname = `/auth/dashboard/${props.endPoint}`;
                }, 900);
            }
        } catch (err) {
            console.log(err.response)
            setAddToast({
                type: "error",
                title: "Request rejected",
                message: getServerErrorMessage(err),
            });
        } finally {
            setIsSubmitting(false)
        }


        

    }
    return (
        <div className="add-items">
            {addToast &&
                <div className={`add-toast ${addToast.type === "success" ? "add-toast-success" : "add-toast-error"}`}>
                    <div className="add-toast-icon">
                        <i className={addToast.type === "success" ? "fa-solid fa-circle-check" : "fa-solid fa-circle-exclamation"}></i>
                    </div>
                    <div className="add-toast-content">
                        <strong>{addToast.title}</strong>
                        <p>{addToast.message}</p>
                    </div>
                    <button type="button" className="add-toast-close" onClick={() => setAddToast(null)}>
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
            }

            <div className="db-page-det">
                <h1>Add {props.pTitle}</h1>
                <Link to={`/auth/dashboard/${props.endPoint}`} className="button">All {props.allBtn}</Link>
            </div>

            <div className="db-form">
                <form onSubmit={submit}>

                    {
                        props.page === "addUser" || props.page === "addDept" || props.page === "addCourse"
                        || props.page === "addStudyPlan" || props.page === "addProg" || props.page === "addSpec" ||
                        props.page === "AddSchedule" &&

                        <Inputs name={setName} title="dd" placeholder="" />
                    }

                    {props.page === 'addUser' &&
                        <>
                            <Inputs  title="Full Name" type = "text" value={fName} setValue={setFName}/>
                            {/* {!fName & accept ? <p className="form-error">Full Name Is Required !</p> : ""} */}


                            <div className="input">
                                <label htmlFor="fatherName"> Father Name :</label>
                                <input id="fatherName" type="text" placeholder="Father Name..." onChange={(e) => setFatherName(e.target.value)} />
                                {!fatherName & accept ? <p className="form-error">Father Name Is Required !</p> : ""}
                            </div>

                            <div className="input">
                                <label htmlFor="motherName"> Mother Name :</label>
                                <input id="motherName" type="text" placeholder="Mother Name..." onChange={(e) => setMotherName(e.target.value)} />
                                {!motherName & accept ? <p className="form-error">Mother Name Is Required !</p> : ""}
                            </div>


                            <div className="input">
                                <label htmlFor="bdate">Birth Date : </label>
                                <Flatpickr
                                    value={birthDate}
                                    className="date-picker"
                                    options={{
                                        dateFormat: "Y-m-d",
                                        maxDate: "today"
                                    }}
                                    onChange={(date, dateStr) => setBirthDate(dateStr)}
                                />
                                {!birthDate & accept ? <p className="form-error"> Birth Date Is Required !</p> : ""}
                            </div>

                            <div className="input">
                                <label htmlFor="birthPlace"> Birth Place :</label>
                                <input id="birthPlace" type="text" placeholder="Birth Place..." onChange={(e) => setBirthPlace(e.target.value)} />
                                {!birthPlace & accept ? <p className="form-error">Birth Place Is Required !</p> : ""}
                            </div>

                            <div className="input">
                                <label htmlFor="centralRegistry"> Central Registry :</label>
                                <input id="centralRegistry" type="text" placeholder="Central Registry..." onChange={(e) => setCentralRegistry(e.target.value)} />
                                {!centralRegistry & accept ? <p className="form-error">Central Registry Is Required !</p> : ""}
                            </div>

                            <div className="input">
                                <label htmlFor="national_id"> National ID :</label>
                                <input id="national_id" type="number" placeholder="National ID..." onChange={(e) => setNationalId(e.target.value)} />
                                {!birthPlace & accept ? <p className="form-error">National ID Is Required !</p> : ""}
                            </div>

                            <div className="input">
                                <label htmlFor="nationality">Nationality :</label>
                                <select id="nationality" onChange={(e) => setNationality(e.target.value)} className="select-items">
                                    <option >Select Nationality</option>
                                    <option value="syrian" >Syrian</option>
                                    <option value="Not Syrian" >Not Syrian</option>
                                </select>
                                {!nationality & accept ? <p className="form-error"> Type Is Required !</p> : ""}
                            </div>

                            <div className="input">
                                <label htmlFor="gender">Gender :</label>
                                <select id="gender" onChange={(e) => setGender(e.target.value)} className="select-items">
                                    <option >Select Gender</option>
                                    <option value="male" >Male</option>
                                    <option value="female" >Female</option>
                                </select>
                                {!gender & accept ? <p className="form-error"> Type Is Required !</p> : ""}
                            </div>

                            <div className="input">
                                <label htmlFor="mobile"> Phone Number :</label>
                                <input id="mobile" type="number" placeholder="Phone Number..." onChange={(e) => setMobile(e.target.value)} />
                                {!mobile & accept ? <p className="form-error">Phone Number Is Required !</p> : ""}
                            </div>

                            <div className="input">
                                <label htmlFor="address"> Address :</label>
                                <input id="address" type="text" placeholder="Address..." onChange={(e) => setAddress(e.target.value)} />
                                {!address & accept ? <p className="form-error">Address Is Required !</p> : ""}
                            </div>

                            <div className="input">
                                <label htmlFor="email">Email :</label>
                                <input id="email" type="email" placeholder="email..." onChange={(e) => setEmail(e.target.value)} />
                                {!email & accept ? <p className="form-error">email Is Required !</p> : ""}
                            </div>

                            <div className="input">
                                <label htmlFor="pass"> Password : </label>
                                <input id="pass" type="pass" placeholder="Password..." onChange={(e) => setPassword(e.target.value)} />
                                {!password & accept ? <p className="form-error"> Password Is Required !</p> : ""}
                            </div>

                            <div className="input">
                                <label htmlFor="rPass">اعادة كلمة السر :</label>
                                <input id="rPass" type="pass" placeholder="Repeat Password..." onChange={(e) => setRePassword(e.target.value)} />
                                {password !== rePassword & accept ? <p className="form-error"> Password Dosen't mutch</p> : ""}
                            </div>

                            <div className="input">
                                <label htmlFor="pass">نوع المستخدم :</label>
                                <select onChange={(e) => setType(e.target.value)} className="select-items">
                                    <option >Select Type</option>
                                    <option value="student" >Student</option>
                                    <option value="employee" >Employee</option>
                                    <option value="doctor" >Doctor</option>
                                </select>
                                {!type & accept ? <p className="form-error"> Type Is Required !</p> : ""}
                            </div>

                            {type === "student" &&
                                <>
                                    <div className="input">
                                        <label htmlFor="proName">Programs : </label>
                                        <select
                                            id="proName"
                                            onChange={(e) => setCurrentProgram(e.target.value)}
                                            className="select-items"
                                        >
                                            <option value="">None</option>
                                            {programs && programs.map((pro, index) => (
                                                <option value={pro.id} key={index} >{pro.name}</option>
                                            ))}
                                        </select>
                                        {!currentProgram & accept ? <p className="form-error"> Program Is Required !</p> : ""}
                                    </div>

                                    {currentProgram &&
                                        <>
                                            <div className="input">
                                                <label htmlFor="specName">Specializations : </label>
                                                <select
                                                    id="specName"
                                                    onChange={(e) => setCurrentSpec(e.target.value)}
                                                    className="select-items"
                                                >
                                                    <option value="" >Select Specialization</option>
                                                    {programSpecs.map((spec, index) => (

                                                        <option value={spec.id} key={index}>{spec.name}</option>

                                                    ))}
                                                </select>
                                                {!currentSpec & currentStudyYear > 3 & accept ? <p className="form-error"> Specialization Is Required !</p> : ""}
                                            </div>

                                            <div className="input">
                                                <label htmlFor="acdYear">Academic Year : </label>
                                                <select
                                                    id="acdYear"
                                                    onChange={(e) => setCurrentAcdYear(e.target.value)}
                                                    className="select-items"
                                                >
                                                    <option value="None" >Select Academic Year</option>
                                                    {acdYears.map((year, index) => (

                                                        <option value={year.id} key={index}>{year.name}</option>

                                                    ))}
                                                </select>
                                                {!currentAcdYear & accept ? <p className="form-error"> Academic Year Is Required !</p> : ""}
                                            </div>

                                            <div className="input">
                                                <label htmlFor="studyYear">Study Year : </label>
                                                <select
                                                    id="studyYear"
                                                    onChange={(e) => setCurrentStudyYear(e.target.value)}
                                                    className="select-items"
                                                >
                                                    <option value="None" >Select Study Year</option>
                                                    {studyYears.map((year, index) => (

                                                        <option value={year.id} key={index}>{year.name}</option>

                                                    ))}
                                                </select>
                                                {!currentStudyYear & accept ? <p className="form-error"> Study Year Is Required !</p> : ""}
                                            </div>
                                        </>
                                    }
                                </>
                            }

                            {type === "employee" &&
                                <>
                                    <div className="input">
                                        <label htmlFor="jobTitle"> Job Title : </label>
                                        <input id="jobTitle" type="text" placeholder="Job Title..." onChange={(e) => setJobTite(e.target.value)} />
                                        {!jobTitle & accept ? <p className="form-error"> Job Title Is Required !</p> : ""}
                                    </div>

                                    <div className="input">
                                        <label htmlFor="depName">Department : </label>
                                        <select
                                            id="depName"
                                            onChange={(e) => setSelectedDept(e.target.value)}
                                            className="select-items"
                                        >
                                            <option value="">Select Department</option>
                                            {departments.map((dept, index) => (
                                                <option value={dept.id} key={index}>{dept.name}</option>
                                            ))}
                                        </select>
                                        {!selectedDept & accept ? <p className="form-error"> Department Is Required !</p> : ""}
                                    </div>

                                    <div className="input">
                                        <label htmlFor="bdate">Hire Date : </label>
                                        <Flatpickr
                                            value={hireDate}
                                            className="date-picker"
                                            options={{
                                                dateFormat: "Y-m-d",
                                                maxDate: "today"
                                            }}
                                            onChange={(date, dateStr) => setHireDate(dateStr)}
                                        />
                                        {!hireDate & accept ? <p className="form-error"> Hire Date Is Required !</p> : ""}
                                    </div>
                                </>
                            }

                        </>
                    }


                    {
                        props.page === "addDept" &&
                        <>
                            <div className="input">
                                <label htmlFor="depName">Dept Name : </label>
                                <input id="depName" type="text" placeholder="Dept Name..." onChange={(e) => setDepName(e.target.value)} value={depName} />
                                {!depName & accept ? <p className="form-error"> Department Name Is Required !</p> : ""}
                            </div>

                            <div className="input">
                                <label htmlFor="depName">Dept Code : </label>
                                <input id="depName" type="text" placeholder="Dept Code..." onChange={(e) => setDepCode(e.target.value)} value={depCode} />
                                {!depCode & accept ? <p className="form-error"> Department Code Is Required !</p> : ""}
                            </div>

                            <div className="input">
                                <label htmlFor="depName">Dept Description : </label>
                                <input id="depName" type="text" placeholder="Dept Description..." onChange={(e) => setDepDesc(e.target.value)} value={depDesc} />
                                {!depDesc & accept ? <p className="form-error"> Department Description Is Required !</p> : ""}
                            </div>

                            <div className="input">
                                <label htmlFor="mgr">Manager : </label>
                                <select
                                    id="mgr"
                                    className="select-items"
                                    value={currentManager}
                                    onChange={(e) => setCurrentManager(e.target.value)}
                                >
                                    <option value="">Select Manger</option>
                                    {props.emps.map((emp, index) => (
                                        <option key={index} value={emp.user_id}>{emp.user.full_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="input">
                                <label htmlFor="isActive">Is Active : </label>
                                <select
                                    id="isActive"
                                    className="select-items"
                                    value={isActive}
                                    onChange={(e) => setIsActive(e.target.value)}
                                >
                                    <option value="">Is Active ?</option>
                                    <option value="1">True</option>
                                    <option value="0">False</option>
                                </select>
                                {!isActive & accept ? <p className="form-error"> Department Active Status Is Required !</p> : ""}
                            </div>
                        </>
                    }


                    {
                        props.page === "addCourse" &&
                        <>
                            <div className="input">
                                <label htmlFor="corCode">Course Code : </label>
                                <input id="corCode" type="text" placeholder="Course Code..." onChange={(e) => setCorCode(e.target.value)} value={corCode} />
                                {!corCode & accept ? <p className="form-error"> Course Code Is Required !</p> : ""}
                            </div>
                            <div className="input">
                                <label htmlFor="coName">Course Name : </label>
                                <input id="coName" type="text" placeholder="Course Name..." onChange={(e) => setCoName(e.target.value)} value={coName} />
                                {!coName & accept ? <p className="form-error"> Course Name Is Required !</p> : ""}
                            </div>
                            <div className="input">
                                <label htmlFor="creHours">Credit Hours : </label>
                                <input id="creHours" type="number" placeholder="Credit Hours..." onChange={(e) => setCreditHours(e.target.value)} value={creditHours} />
                                {!creditHours & accept ? <p className="form-error"> Credit Hours Is Required !</p> : ""}
                            </div>
                            <div className="input">
                                <label htmlFor="corDesc">Course Description : </label>
                                <input id="corDesc" type="text" placeholder="Course Description..." onChange={(e) => setCorDesc(e.target.value)} value={corDesc} />
                                {!corDesc & accept ? <p className="form-error"> Course Description Is Required !</p> : ""}
                            </div>
                            <div className="input">
                                <label htmlFor="isActive">Is Active : </label>
                                <select
                                    id="isActive"
                                    className="select-items"
                                    value={isActive}
                                    onChange={(e) => setIsActive(e.target.value)}
                                >
                                    <option value="">Is Active ?</option>
                                    <option value="1">True</option>
                                    <option value="0">False</option>
                                </select>
                                {!isActive & accept ? <p className="form-error"> Department Active Status Is Required !</p> : ""}
                            </div>
                        </>
                    }


                    {props.page === "addStudyPlan" &&
                        <>

                            <div className="input">
                                <label htmlFor="name">Name : </label>
                                <input id="name" type="text" placeholder="Name..." onChange={(e) => setName(e.target.value)} value={name} />
                                {!name & accept ? <p className="form-error"> Name Is Required !</p> : ""}
                            </div>

                            <div className="input">
                                <label htmlFor="program">Program : </label>
                                <select
                                    id="program"
                                    className="select-items"
                                    value={currentProgram}
                                    onChange={(e) => setCurrentProgram(e.target.value)}
                                >
                                    <option value="">Select Program</option>
                                    {programs && programs.map((prog, index) => (
                                        <option key={index} value={prog.id}>{prog.name}</option>
                                    ))}
                                </select>
                                {!currentProgram & accept ? <p className="form-error"> Program Is Required !</p> : ""}
                            </div>

                            <div className="input">
                                <label htmlFor="Specialization">Specialization : </label>
                                <select
                                    id="Specialization"
                                    className="select-items"
                                    value={currentSpec}
                                    onChange={(e) => setCurrentSpec(e.target.value)}
                                >
                                    <option value="">Select Specialization</option>
                                    {programSpecs && programSpecs.map((spec, index) => (
                                        <option key={index} value={spec.id}>{spec.name}</option>
                                    ))}
                                </select>
                                {!currentSpec & accept ? <p className="form-error"> Specialization Is Required !</p> : ""}
                            </div>

                            <div className="input">
                                <label htmlFor="studyYear">Study Year : </label>
                                <select
                                    id="studyYear"
                                    onChange={(e) => setCurrentStudyYear(e.target.value)}
                                    className="select-items"
                                >
                                    <option value="None" >Select Study Year</option>
                                    {studyYears.map((year, index) => (

                                        <option value={year.id} key={index}>{year.name}</option>

                                    ))}
                                </select>
                                {!currentStudyYear & accept ? <p className="form-error"> Study Year Is Required !</p> : ""}
                            </div>

                            <div className="input">
                                <label htmlFor="Semster">Semster : </label>
                                <select
                                    id="Semster"
                                    onChange={(e) => setSemsterNum(e.target.value)}
                                    className="select-items"
                                >
                                    <option value="None" >Select Semster</option>
                                    <option value="1" >1</option>
                                    <option value="2" >2</option>

                                </select>
                                {!currentStudyYear & accept ? <p className="form-error"> Study Year Is Required !</p> : ""}
                            </div>


                        </>
                    }


                    {
                        props.page === "addEmp" &&
                        <>
                            <div className="input">
                                <label htmlFor="depName">Dept Name : </label>
                                <input id="depName" type="text" placeholder="Dept Name..." onChange={(e) => setDepName(e.target.value)} />
                            </div>

                            <div className="input">
                                <label htmlFor="mgr">Manager : </label>
                                {/* <input id="mgr" type="text" placeholder="Manager Name..." onChange={(e) => setManager(e.target.value)} /> */}
                                <Select
                                    defaultValue={currentManager}
                                    onChange={setCurrentManager}
                                    options={props.deptOption}
                                    isSearchable={true} // تفعيل البحث
                                    placeholder="ابحث أو اختر..."
                                />
                            </div>
                        </>
                    }


                    {
                        props.page === "addProg" &&
                        <>
                            <div className="input" >
                                <label htmlFor="name">Programe Name : </label>
                                <input
                                    id="name"
                                    type="text"
                                    placeholder="Program Name..."
                                    onChange={(e) => setName(e.target.value)}
                                    value={name}
                                />
                                {!name & accept ? <p className="form-error"> Programe Name Is Required !</p> : ""}
                            </div>


                            <div className="input" >
                                <label htmlFor="years">Total Years : </label>
                                <input
                                    id="years"
                                    type="text"
                                    placeholder="Program Years..."
                                    onChange={(e) => setYears(e.target.value)}
                                    value={years}
                                />
                                {!years & accept ? <p className="form-error"> Years Is Required !</p> : ""}
                            </div>


                            <div className="input">
                                <label htmlFor="level">Level : </label>
                                <select
                                    id="level"
                                    onChange={(e) => setLevel(e.target.value)}
                                    className="select-items"
                                    value={level}
                                >
                                    <option value=""> Select Level </option>
                                    <option value="bachelor"> Bachelor </option>
                                    <option value="master"> Master </option>
                                    <option value="phd"> Doctorate </option>
                                </select>
                                {!level & accept ? <p className="form-error"> level Is Required !</p> : ""}
                            </div>
                        </>
                    }


                    {
                        props.page === "addSpec" &&
                        <>
                            <div className="input">
                                <label htmlFor="spec">Specialization Name : </label>
                                <input
                                    id="spec"
                                    type="text"
                                    placeholder="Specialization Name..."
                                    onChange={(e) => setName(e.target.value)}
                                    value={name}
                                />
                            </div>

                            <div className="input">
                                <label htmlFor="programs">Programs : </label>
                                <select
                                    id="programs"
                                    onChange={(e) => setSelectedValue(e.target.value)}
                                    className="select-items"
                                >
                                    <option value="">Select Promram</option>
                                    {props.specsData.map((spec, index) => (
                                        <option value={spec.id} key={index}>{spec.name}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    }

                    {
                        props.page === "add-assignment" &&
                        <>

                            <div className="input">
                                <label htmlFor="doctor">Doctor : </label>
                                <select
                                    id="doctor"
                                    onChange={(e) => setSelectedValue(e.target.value)}
                                    className="select-items"
                                >
                                    <option value="">Select Doctor</option>
                                    {doctors.map((doc, index) => (
                                        <option value={doc.id} key={index}>{doc.user.full_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="input">
                                <label htmlFor="course">Course : </label>
                                <select
                                    id="course"
                                    onChange={(e) => setSelectedCourse(e.target.value)}
                                    className="select-items"
                                >
                                    <option value="">Select Course</option>
                                    {courses.map((cor, index) => (
                                        <option value={cor.id} key={index}>{cor.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="input">
                                <label htmlFor="acd-year">Academic year : </label>
                                <select
                                    id="acd-year"
                                    onChange={(e) => setSelectedAcdYear(e.target.value)}
                                    className="select-items"
                                >
                                    <option value="">Select Academic Year</option>
                                    {acdYears.map((year, index) => (
                                        <option value={year.id} key={index}>{year.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="input">
                                <label htmlFor="course">Semster : </label>
                                <select
                                    id="course"
                                    onChange={(e) => setSemsterNum(e.target.value)}
                                    className="select-items"
                                >
                                    <option value="">Select Semster</option>
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                </select>
                            </div>

                            <div className="input">
                                <label htmlFor="course">Is Primary : </label>
                                <select
                                    id="course"
                                    onChange={(e) => setIsPrimary(e.target.value)}
                                    className="select-items"
                                >
                                    <option value="">Select Option</option>
                                    <option value="1">True</option>
                                    <option value="2">False</option>
                                </select>
                            </div>
                        </>
                    }

                    {
                        props.page === "AddSchedule" &&
                        <>
                            <div className="input">
                                <label htmlFor="program">Program : </label>
                                <select
                                    id="program"
                                    value={currentProgram}
                                    onChange={(e) => setCurrentProgram(e.target.value)}
                                    className="select-items"
                                >
                                    <option value="">Select Course</option>
                                    {programs.map((pro, index) => (
                                        <option value={pro.id} key={index}>{pro.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="input">
                                <label htmlFor="st-year">Study Year : </label>
                                <select
                                    id="st-year"
                                    value={currentStudyYear}
                                    onChange={(e) => setCurrentStudyYear(e.target.value)}
                                    className="select-items"
                                >
                                    <option value="">Select Course</option>

                                    {programs.map((prog, index) => (
                                        prog.study_years.map((year, index) => (
                                            <option value={year.id} key={index}>{year.name}</option>
                                        ))
                                    ))}
                                </select>
                            </div>

                            <div className="input">
                                <label htmlFor="spec">Specialization : </label>
                                <select
                                    id="spec"
                                    value={currentSpec}
                                    onChange={(e) => setCurrentSpec(e.target.value)}
                                    className="select-items"
                                >
                                    <option value="">Select Course</option>
                                    <option value="">None</option>
                                    {programs.map((prog, index) => (
                                        prog.specializations.map((year, index) => (
                                            <option value={year.id} key={index}>{year.name}</option>
                                        ))
                                    ))}
                                </select>
                            </div>

                            <Semster setSemNum={setSemsterNum} currentStudyYear={currentStudyYear} accept={accept} />
                        </>
                    }


                    {
                        props.page === "AddSchedule" &&
                        <>
                        <IsActive isActive={isActive} setIsActive={setIsActive} />

                        </>
                    }

                    {
                        props.page === "addGrade" &&
                        <>
                            <Select title="Academic Year" items={props.acdYears} value={currentAcdYear} setValue = {setCurrentAcdYear} />
                            <Select title="Course" items={props.courses} sendValue ="code" value={selectedValue} setValue={setSelectedValue}/>
                            <Select title="Grade" value={gradeType} setValue={setGradeType}/>
                            <Inputs title = "Student Number" type="text" value={stNum} setValue={setStNum}/>
                            <Inputs title = "Mark" type="number" value={mark} setValue={setMark}/>
                        </>
                    }

                    <div className="btn">
                        <button type="submit" className="button" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : `Add ${props.pTitle}`}
                        </button>
                    </div>



                </form>
            </div>
        </div>
    )
}