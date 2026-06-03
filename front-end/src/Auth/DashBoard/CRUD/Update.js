
import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/airbnb.css";
// import "flatpickr/dist/themes/material_blue.css";
// import "flatpickr/dist/themes/dark.css";


import api from "../../Api/axios";
import Input from "../../Components/input/Input";
import Inputs from "../../Components/input/Input";
import Select from "../../Components/input/Select";
import IsActive from "../../Components/input/IsActive";
export default function Update(props) {

    const id = useParams().id;
    const [name, setName] = useState("")

    // Main 
    const [accept, setAccept] = useState(false);
    const [open, setOpen] = useState(false);
    const [doneAdd, setDoneAdd] = useState(false)
    const [items, setItems] = useState([])
    const [isActive, setIsActive] = useState('');
    const [desc, setDesc] = useState("")
    const [code, setCode] = useState('');
    const [selectedValue, setSelectedValue] = useState("");
    const [courses, setCourses] = useState([])
    const [selectedCourse, setSelectedCourse] = useState()
    const [acdYears, setAcdYears] = useState([])
    const [currentAcdYear, setCurrentAcdYear] = useState("")
    const [doctors, setDoctors] = useState()
    const [isPrimary, setIsPrimary] = useState("")
    // UseEffects State 
    const [programSpecs, setProgramSpecs] = useState([])
    // console.log(programSpecs)
    const [programs, setPrograms] = useState([])
    const [studyYears, setStudyYears] = useState([])
    const [departments, setDepartments] = useState([])
    // current State
    const [currentProgram, setCurrentProgram] = useState("")


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
    const [currentSpec, setCurrentSpec] = useState("")

    const [currentStudyYear, setCurrentStudyYear] = useState("")


    // User Type Employee State
    const [jobTitle, setJobTite] = useState("")
    const [currentDept, setCurrentDept] = useState("");
    const [hireDate, setHireDate] = useState("");


    // Add Dept State
    const [currentManager, setCurrentManager] = useState('');


    // Add Course State
    const [creditHours, setCreditHours] = useState("")
    const [semsterNum, setSemsterNum] = useState("")


    /// Program State
    const [level, setLevel] = useState("")
    const [years, setYears] = useState("")

    let dataToAdd = {}


    // Get Programs 
    useEffect(() => {
        if (type === "student" || props.page === "updateStudyPlan" || props.page === "updateSchedule") {
            let fetchData = async () => {
                let res = await api.get('programs')
                setPrograms(res.data.data)
            }
            fetchData()
        }

        if (type === "employee") {
            let fetchData = async () => {
                let res = await api.get('departments')
                setDepartments(res.data)
            }
            fetchData()
        }

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


    useEffect(() => {

        let getData = async () => {
            let res = await api.get(`${props.endPoint}/${id}`)

            if (props.page === "updateUser") {
                setFName(res.data.full_name)
                setFatherName(res.data.father_name)
                setMotherName(res.data.mother_name)
                setEmail(res.data.email)
                setBirthDate(res.data.birth_date.split("T")[0])
                setBirthPlace(res.data.birth_place)
                setCentralRegistry(res.data.central_registry)
                setNationalId(res.data.national_id)
                setNationality(res.data.nationality)
                setGender(res.data.gender)
                setMobile(res.data.mobile)
                setAddress(res.data.address)
                setEmail(res.data.email)
                setType(res.data.type)

                if (res.data.type === "student") {
                    setCurrentProgram(res.data.student.program_id)
                    setCurrentSpec(res.data.student.specialization_id)
                    setCurrentAcdYear(res.data.student.academic_records[0].academic_year_id)
                    setCurrentStudyYear(res.data.student.academic_records[0].study_year.id)
                }

                if (res.data.type === "employee") {
                    setCurrentDept(res.data.employee.department_id)
                    setJobTite(res.data.employee.job_title)
                    setHireDate(res.data.employee.hire_date.split("T")[0])
                }
            } else if (props.page === "updateDept") {
                setName(res.data.name)
                setCode(res.data.code)
                setDesc(res.data.description)
                setCurrentManager(res.data.manager_employee ? res.data.manager_employee.user_id : "")
                setIsActive(res.data.is_active)
            } else if (props.page === "updateCourse") {
                setCode(res.data.code)
                setName(res.data.name)
                setCreditHours(res.data.credit_hours)
                setDesc(res.data.description)
                setIsActive(res.data.is_active)
            } else if (props.page === "updateStudyPlan") {
                setItems(res.data)
                setName(res.data.name)
                setCurrentProgram(res.data.program_id)
                setCurrentStudyYear(res.data.study_year_id)
                setCurrentSpec(res.data.specialization_id && res.data.specialization_id)
                setSemsterNum(res.data.semester_number)
                setIsActive(res.data.is_active)
            } else if (props.page === "updateProgram") {
                setName(res.data.name)
                setYears(res.data.total_years)
                setLevel(res.data.level)
            } else if (props.page === "updateSpec") {
                // console.log(res.data)
                setName(res.data.name)
                setSelectedValue(res.data.program.id)
            } else if (props.page === "updateAssignment") {
                setSelectedValue(res.data.doctor_id)
                setSelectedCourse(res.data.course_id)
                setCurrentAcdYear(res.data.academic_year_id)
                setSemsterNum(res.data.semester_number)
                setIsPrimary(res.data.is_primary)
            } else if (props.page === "updateSchedule") {
                setName(res.data.name)
                setCurrentProgram(res.data.program_id)
                setCurrentStudyYear(res.data.study_year_id)
                setCurrentSpec(res.data.specialization_id)
                setSemsterNum(res.data.semester_number)
                setIsActive(res.data.is_active)
            }
            // console.log(res.data)
        }
        getData()


    }, [doneAdd])

    // console.log(programs)
    async function submit(e) {
        let flag = true;
        e.preventDefault();
        setAccept(true)

        if (props.page === "updateUser") {

            if (
                fName === "" || fatherName === "" || motherName === "" || email === ""
                || birthDate === "" || birthPlace === "" || nationalId === "" || gender === ""
                || centralRegistry === "" || nationality === "" || mobile === ""
                || address === "" || type === ""
            ) {
                flag = false
            } else if (flag) {
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
                        department_id: currentDept,
                        job_title: jobTitle,
                        hire_date: hireDate,
                    }
                }
            }

        } else if (props.page === "updateDept") {

            if (name === "" || code === "" || desc === "" || isActive === "") {
                flag = false
            } else if (flag) {
                dataToAdd = {
                    name: name,
                    code: code,
                    description: desc,
                    manager_user_id: currentManager,
                    is_active: isActive,
                }
            }

        } else if (props.page === "updateCourse") {
            if (code === "" || name === "" || creditHours === "" || desc === "") {
                flag = false
            } else if (flag) {
                dataToAdd = {
                    code: code,
                    name: name,
                    credit_hours: creditHours,
                    description: desc,
                    is_active: isActive,
                }
            }
        } else if (props.page === "updateProgram") {
            if (!name || !years || !level || years === 0) {
                flag = false
            } else if (flag) {
                dataToAdd = {
                    name: name,
                    total_years: years,
                    level: level
                }
            }
        } else if (props.page === "updateSpec") {
            if (!name || !selectedValue) {
                flag = false
            } else if (flag) {
                dataToAdd = {
                    name: name,
                    program_id: selectedValue
                }
            }
        } else if (props.page === "updateAssignment") {
            if (!selectedValue || !selectedCourse || !currentAcdYear || !semsterNum || isPrimary === "") {
                flag = false
            } else {
                dataToAdd = {
                    "doctor_id": selectedValue,
                    "course_id": selectedCourse,
                    "academic_year_id": currentAcdYear,
                    "semester_number": semsterNum,
                    "is_primary": isPrimary
                }
            }
        } else if (props.page === "updateSchedule"){
            if(!name || !currentProgram ||!currentStudyYear || !semsterNum || isActive === null){
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
            }
        }else flag = true;



        try {
            if (flag) {
                let res = await api.put(`${props.endPoint}/${id}`, dataToAdd)
                if (res.status === 200) {
                    window.location.pathname = `/auth/dashboard/${props.endPoint}`;

                }
            }
        } catch (err) {
            console.log(err.response)
        }
    }

    async function addCourseToStudyPlan(courseId) {
        try {
            let res = await api.post(`study-plans/${id}/courses`, {
                "courses": [
                    {
                        "course_id": courseId,
                    },

                ]
            })
            res.status === 200 && setDoneAdd((prev) => !prev)
            // console.log(res.status)
        } catch (err) {
            console.log(err.response)
        }
    }

    async function autoEnroll(userID) {
        try{
             let res = await api.post(`/students/1/auto-enroll`, {

            "academic_year_id": 1,
            "study_year_id": 1


        })
        }catch(err){
            console.log(err.response)
        }
        // console.log(res)
    }

    return (
        <div className="add-items">
            <div className="db-page-det">
                <h1>Update {props.pTitle}</h1>
                <Link to={`/auth/dashboard/${props.endPoint}`} className="button">All {props.allBtn}</Link>
            </div>

            <div className="db-form">
                <form onSubmit={submit}>

                    {props.page === 'updateUser' &&
                        <>
                            <div className="input">
                                <label htmlFor="fname"> Full Name : </label>
                                <input id="fname" type="text" placeholder="Full Name..." onChange={(e) => setFName(e.target.value)} value={fName} />
                                {!fName & accept ? <p className="form-error">Full Name Is Required !</p> : ""}
                            </div>

                            <div className="input">
                                <label htmlFor="fatherName"> Father Name :</label>
                                <input id="fatherName" type="text" placeholder="Father Name..." onChange={(e) => setFatherName(e.target.value)} value={fatherName} />
                                {!fatherName & accept ? <p className="form-error">Father Name Is Required !</p> : ""}
                            </div>

                            <div className="input">
                                <label htmlFor="motherName"> Mother Name :</label>
                                <input id="motherName" type="text" placeholder="Mother Name..." onChange={(e) => setMotherName(e.target.value)} value={motherName} />
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
                                <input id="birthPlace" type="text" placeholder="Birth Place..." onChange={(e) => setBirthPlace(e.target.value)} value={birthPlace} />
                                {!birthPlace & accept ? <p className="form-error">Birth Place Is Required !</p> : ""}
                            </div>

                            <div className="input">
                                <label htmlFor="centralRegistry"> Central Registry :</label>
                                <input id="centralRegistry" type="text" placeholder="Central Registry..." onChange={(e) => setCentralRegistry(e.target.value)} value={centralRegistry} />
                                {!centralRegistry & accept ? <p className="form-error">Central Registry Is Required !</p> : ""}
                            </div>

                            <div className="input">
                                <label htmlFor="national_id"> National ID :</label>
                                <input id="national_id" type="number" placeholder="National ID..." onChange={(e) => setNationalId(e.target.value)} value={nationalId} />
                                {!birthPlace & accept ? <p className="form-error">National ID Is Required !</p> : ""}
                            </div>

                            <div className="input">
                                <label htmlFor="nationality">Nationality :</label>
                                <select id="nationality" onChange={(e) => setNationality(e.target.value)} className="select-items" value={nationality}>
                                    <option >Select Nationality</option>
                                    <option value="syrian" >Syrian</option>
                                    <option value="Not Syrian" >Not Syrian</option>
                                </select>
                                {!nationality & accept ? <p className="form-error"> Type Is Required !</p> : ""}
                            </div>

                            <div className="input">
                                <label htmlFor="gender">Gender :</label>
                                <select id="gender" onChange={(e) => setGender(e.target.value)} className="select-items" value={gender}>
                                    <option >Select Gender</option>
                                    <option value="male" >Male</option>
                                    <option value="female" >Female</option>
                                </select>
                                {!gender & accept ? <p className="form-error"> Type Is Required !</p> : ""}
                            </div>

                            <div className="input">
                                <label htmlFor="mobile"> Phone Number :</label>
                                <input id="mobile" type="number" placeholder="Phone Number..." onChange={(e) => setMobile(e.target.value)} value={mobile} />
                                {!mobile & accept ? <p className="form-error">Phone Number Is Required !</p> : ""}
                            </div>

                            <div className="input">
                                <label htmlFor="address"> Address :</label>
                                <input id="address" type="text" placeholder="Address..." onChange={(e) => setAddress(e.target.value)} value={address} />
                                {!address & accept ? <p className="form-error">Address Is Required !</p> : ""}
                            </div>

                            <div className="input">
                                <label htmlFor="email">Email :</label>
                                <input id="email" type="email" placeholder="email..." onChange={(e) => setEmail(e.target.value)} value={email} />
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
                                <select onChange={(e) => setType(e.target.value)} className="select-items" value={type}>
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
                                            value={currentProgram}
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
                                                    value={currentSpec}
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
                                                    value={currentAcdYear}
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
                                                    value={currentStudyYear}
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
                                    <span onClick={() => autoEnroll(id)}>اسناد مقررات</span>
                                </>
                            }

                            {type === "employee" &&
                                <>
                                    <div className="input">
                                        <label htmlFor="jobTitle"> Job Title : </label>
                                        <input id="jobTitle" type="text" placeholder="Job Title..." onChange={(e) => setJobTite(e.target.value)} value={jobTitle} />
                                        {!jobTitle & accept ? <p className="form-error"> Job Title Is Required !</p> : ""}
                                    </div>

                                    <div className="input">
                                        <label htmlFor="dName">Department : </label>
                                        <select
                                            id="dName"
                                            onChange={(e) => setCurrentDept(e.target.value)}
                                            className="select-items"
                                            value={currentDept}
                                        >
                                            <option value="">Select Department</option>
                                            {departments.map((dept, index) => (
                                                <option value={dept.id} key={index}>{dept.name}</option>
                                            ))}
                                        </select>
                                        {!currentDept & accept ? <p className="form-error"> Department Is Required !</p> : ""}
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
                        props.page === "updateDept" &&
                        <>
                            <div className="input">
                                <label htmlFor="name">Dept Name : </label>
                                <input id="name" type="text" placeholder="Dept Name..." onChange={(e) => setName(e.target.value)} value={name} />
                                {!name & accept ? <p className="form-error"> Department Name Is Required !</p> : ""}
                            </div>

                            <div className="input">
                                <label htmlFor="code">Dept Code : </label>
                                <input id="code" type="text" placeholder="Dept Code..." onChange={(e) => setCode(e.target.value)} value={code} />
                                {!code & accept ? <p className="form-error"> Department Code Is Required !</p> : ""}
                            </div>

                            <div className="input">
                                <label htmlFor="desc">Dept Description : </label>
                                <input id="desc" type="text" placeholder="Dept Description..." onChange={(e) => setDesc(e.target.value)} value={desc} />
                                {!desc & accept ? <p className="form-error"> Department Description Is Required !</p> : ""}
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
                                    value={isActive === true ? "1" : isActive === false ? "0" : ""}
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

                    {props.page === "updateStudyPlan" &&
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
                                    value={currentSpec ? currentSpec : ""}
                                    onChange={(e) => setCurrentSpec(e.target.value)}
                                >
                                    <option value="NULL">Select Specialization</option>
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
                                    value={semsterNum}
                                >
                                    <option value="None" >Select Semster</option>
                                    <option value="1" >1</option>
                                    <option value="2" >2</option>

                                </select>
                                {!currentStudyYear & accept ? <p className="form-error"> Study Year Is Required !</p> : ""}
                            </div>

                            <div className="input">
                                <label htmlFor="isActive">Is Active : </label>
                                <select
                                    id="isActive"
                                    className="select-items"
                                    value={isActive === true ? "1" : isActive === false ? "0" : ""}
                                    onChange={(e) => setIsActive(e.target.value)}
                                >
                                    <option value="">Is Active ?</option>
                                    <option value="1">True</option>
                                    <option value="0">False</option>
                                </select>
                                {!isActive & accept ? <p className="form-error"> Study Plan Active Status Is Required !</p> : ""}
                            </div>
                            {items.study_plan_courses &&
                                <>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Course Name</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.study_plan_courses.map((item, index) => (
                                                <tr key={index}>
                                                    <td>{item.course.name}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {/* <div className="input">
                                        <label htmlFor="addCourse">Add Courses To Study Plan </label>
                                        <select
                                            id="addCourse"
                                            className="select-items"
                                            onChange={(e) => setIsActive(e.target.value)}
                                        >
                                            <option value="">Add Courses To Study Plan</option>
                                            {props.coursesData.map((item , index) => (
                                                <option value={item.id} key={index}>{item.name}</option>
                                            ))}
                                        </select>
                                        {!isActive & accept ? <p className="form-error"> Study Plan Active Status Is Required !</p> : ""}
                                    </div> */}
                                    <span className="button" onClick={() => setOpen(prev => !prev)} >Assign Courses To Study Plan</span>
                                    {open &&
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Course Name</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {props.coursesData.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>{item.name}</td>
                                                        <td><span onClick={() => addCourseToStudyPlan(item.id)} className="button">ADD</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    }
                                </>
                            }
                        </>
                    }

                    {
                        props.page === "updateCourse" &&
                        <>
                            <div className="input">
                                <label htmlFor="code">Course Code : </label>
                                <input id="code" type="text" placeholder="Course Code..." onChange={(e) => setCode(e.target.value)} value={code} />
                                {!code & accept ? <p className="form-error"> Course Code Is Required !</p> : ""}
                            </div>
                            <div className="input">
                                <label htmlFor="name">Course Name : </label>
                                <input id="name" type="text" placeholder="Course Name..." onChange={(e) => setName(e.target.value)} value={name} />
                                {!name & accept ? <p className="form-error"> Course Name Is Required !</p> : ""}
                            </div>
                            <div className="input">
                                <label htmlFor="creHours">Credit Hours : </label>
                                <input id="creHours" type="number" placeholder="Credit Hours..." onChange={(e) => setCreditHours(e.target.value)} value={creditHours} />
                                {!creditHours & accept ? <p className="form-error"> Credit Hours Is Required !</p> : ""}
                            </div>
                            <div className="input">
                                <label htmlFor="desc">Course Description : </label>
                                <input id="desc" type="text" placeholder="Course Description..." onChange={(e) => setDesc(e.target.value)} value={desc} />
                                {!desc & accept ? <p className="form-error"> Course Description Is Required !</p> : ""}
                            </div>
                            <div className="input">
                                <label htmlFor="isActive">Is Active : </label>
                                <select
                                    id="isActive"
                                    className="select-items"
                                    value={isActive === true ? "1" : isActive === false ? "0" : ""}
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
                        props.page === "updateProgram" &&
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
                        props.page === "updateSpec" &&
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
                                <label htmlFor="programs">Program : </label>
                                <select
                                    id="programs"
                                    onChange={(e) => setSelectedValue(e.target.value)}
                                    className="select-items"
                                    value={selectedValue}
                                >
                                    <option value="">Select Program</option>
                                    {props.specsData.map((spec, index) => (
                                        <option value={spec.id} key={index}>{spec.name}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    }


                    {
                        props.page === "updateAssignment" &&
                        <>

                            <div className="input">
                                <label htmlFor="doctor">Doctor : </label>
                                <select
                                    id="doctor"
                                    value={selectedValue}
                                    onChange={(e) => setSelectedValue(e.target.value)}
                                    className="select-items"
                                >
                                    <option value="">Select Doctor</option>
                                    {props.doctors.map((doc, index) => (
                                        <option value={doc.id} key={index}>{doc.user.full_name}</option>
                                    ))}
                                </select>
                            </div>

                            <Select title="Course" value={selectedCourse} setValue={setSelectedCourse} items={props.courses}/>     
            

                            <div className="input">
                                <label htmlFor="acd-year">Academic year : </label>
                                <select
                                    id="acd-year"
                                    value={currentAcdYear}
                                    onChange={(e) => setCurrentAcdYear(e.target.value)}
                                    className="select-items"
                                >
                                    <option value="">Select Academic Year</option>
                                    {props.acdYears.map((year, index) => (
                                        <option value={year.id} key={index}>{year.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="input">
                                <label htmlFor="course">Semster : </label>
                                <select
                                    id="course"
                                    value={semsterNum}
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
                                    value={isPrimary === true ? "1" : isPrimary === false ? "0" : ""}
                                    onChange={(e) => setIsPrimary(e.target.value)}
                                    className="select-items"
                                >
                                    <option value="">Select Option</option>
                                    <option value="1">True</option>
                                    <option value="0">False</option>
                                </select>
                            </div>
                        </>
                    }

                    {
                        props.page === "updateSchedule" && 
                        <>
                        <Inputs title="name" type="text" value={name} setValue={setName} />
                        <Select title="Program" value={currentProgram} setValue={setCurrentProgram} items={programs}/>     
                        <Select title="StudyYear" value={currentStudyYear} setValue={setCurrentStudyYear} items={studyYears}/>     
                        <Select title="Specialization" value={currentSpec} setValue={setCurrentSpec} items={programSpecs}/>     
                        <Select title="Semster" value={semsterNum} setValue={setSemsterNum} items={programSpecs}/>     
                        <IsActive isActive={isActive} setIsActive={setIsActive}/>

                        </>

                    }

                    <div className="btn">
                        <button type="submit" className="button">Update {props.pTitle}</button>
                    </div>



                </form>
            </div>
        </div>
    )
}














