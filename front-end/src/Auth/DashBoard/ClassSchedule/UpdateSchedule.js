import { useEffect, useMemo, useState } from "react";
import Inputs from "../../Components/input/Input";
import Update from "../CRUD/Update";
import api from "../../Api/axios";
import { useParams } from "react-router-dom";
import Select from "../../Components/input/Select";
import useDataStore, { days } from "../../../useDataStore";
import IsActive from "../../Components/input/IsActive";

const TIME_SLOTS = [
  {
    key: "08:00-10:00",
    title: "المحاضرة الأولى",
    start: "08:00",
    end: "10:00",
  },
  {
    key: "10:00-12:00",
    title: "المحاضرة الثانية",
    start: "10:00",
    end: "12:00",
  },
  {
    key: "12:00-14:00",
    title: "المحاضرة الثالثة",
    start: "12:00",
    end: "14:00",
  },
  {
    key: "14:00-16:00",
    title: "المحاضرة الرابعة",
    start: "14:00",
    end: "16:00",
  },
];

function normalizeTime(time) {
  if (!time) return "";
  return String(time).slice(0, 5);
}

function getScheduleItems(schedule) {
  if (!schedule) return [];

  if (Array.isArray(schedule.items)) return schedule.items;
  if (Array.isArray(schedule.schedule_items)) return schedule.schedule_items;
  if (Array.isArray(schedule.class_schedule_items)) return schedule.class_schedule_items;
  if (Array.isArray(schedule.lectures)) return schedule.lectures;

  return [];
}

function getLectureId(lecture) {
  return (
    lecture?.id ||
    lecture?.item_id ||
    lecture?.class_schedule_item_id ||
    lecture?.schedule_item_id
  );
}

function sameDay(itemDay, selectedDay) {
  const normalizedItemDay = String(itemDay || "").toLowerCase();
  const normalizedSelectedDay = String(selectedDay || "").toLowerCase();

  const aliases = {
    sunday: ["sunday"],
    monday: ["monday", "moday"],
    tuesday: ["tuesday"],
    wednesday: ["wednesday", "wednsday"],
    thursday: ["thursday"],
    friday: ["friday"],
    saturday: ["saturday"],
  };

  return aliases[normalizedSelectedDay]?.includes(normalizedItemDay);
}

function getCourseName(item, courses) {
  if (!item) return "";

  return (
    item.course?.name ||
    item.course?.title ||
    item.course?.course_name ||
    item.course_name ||
    courses.find((course) => String(course.id) === String(item.course_id))?.name ||
    courses.find((course) => String(course.id) === String(item.course_id))?.title ||
    "مادة غير معروفة"
  );
}

export default function UpdateSchedule() {
  const [studyPlans, setStudyPlans] = useState([]);

  const [hall, setHall] = useState("");
  const [selectedSubj, setSelectedSubj] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isActive, setIsActive] = useState(false);

  const [editingLecture, setEditingLecture] = useState(null);
  const [isSavingLecture, setIsSavingLecture] = useState(false);
  const [deletingLectureId, setDeletingLectureId] = useState(null);

  const { id } = useParams();

  const courses = useDataStore((state) => state.courses);
  const fetchCourses = useDataStore((state) => state.fetchCourses);

  const schedById = useDataStore((state) => state.schedById);
  const isLoadingSchedById = useDataStore((state) => state.isLoadingSchedById);
  const fetchSchedById = useDataStore((state) => state.fetchSchedById);

  useEffect(() => {
    if (courses.length === 0) {
      fetchCourses();
    }
  }, [courses.length, fetchCourses]);

  useEffect(() => {
    if (id) {
      fetchSchedById(id);
    }
  }, [id, fetchSchedById]);

  useEffect(() => {
    async function getStudyPlans() {
      try {
        const stPlan = await api.get("/study-plans");
        setStudyPlans(stPlan.data.data || []);
      } catch (err) {
        console.log(err.response || err);
      }
    }

    getStudyPlans();
  }, []);

  const scheduleCourses = useMemo(() => {
    if (!schedById || studyPlans.length === 0) return [];

    return studyPlans
      .filter((plan) => {
        const sameProgram =
          String(plan.program_id) === String(schedById.program_id);

        const sameSemester =
          String(plan.semester_number) === String(schedById.semester_number);

        const planSpecId =
          plan.specialization_id || plan.specialization?.id || null;

        const schedSpecId =
          schedById.specialization_id || schedById.specialization?.id || null;

        const sameSpecialization =
          String(planSpecId || "") === String(schedSpecId || "");

        return sameProgram && sameSemester && sameSpecialization;
      })
      .flatMap((plan) => plan.courses || []);
  }, [studyPlans, schedById]);

  const scheduleItems = useMemo(() => {
    return getScheduleItems(schedById);
  }, [schedById]);

  function findLecture(dayId, slot) {
    return scheduleItems.find((item) => {
      const itemStart = normalizeTime(item.start_time);
      const itemEnd = normalizeTime(item.end_time);

      return (
        sameDay(item.day_of_week, dayId) &&
        itemStart === slot.start &&
        itemEnd === slot.end
      );
    });
  }

  function resetLectureForm() {
    setHall("");
    setSelectedSubj("");
    setSelectedDay("");
    setStartTime("");
    setEndTime("");
    setIsActive(false);
    setEditingLecture(null);
  }

  function handleEditClick(lecture) {
    setEditingLecture(lecture);

    setHall(lecture.hall || "");
    setSelectedSubj(String(lecture.course_id || lecture.course?.id || ""));
    setSelectedDay(lecture.day_of_week || "");
    setStartTime(normalizeTime(lecture.start_time));
    setEndTime(normalizeTime(lecture.end_time));

    setIsActive(Boolean(lecture.is_active ?? lecture.active ?? true));
  }

  async function handleDeleteClick(lecture) {
    const lectureId = getLectureId(lecture);

    if (!lectureId) {
      alert("لم يتم العثور على ID المحاضرة");
      return;
    }

    const confirmDelete = window.confirm("هل أنت متأكد من حذف هذه المحاضرة؟");

    if (!confirmDelete) return;

    try {
      setDeletingLectureId(lectureId);

      await api.delete(`class-schedule-items/${lectureId}`);

      await fetchSchedById(id);

      if (editingLecture && getLectureId(editingLecture) === lectureId) {
        resetLectureForm();
      }
    } catch (err) {
      console.log(err.response || err);
      alert("حدث خطأ أثناء حذف المحاضرة");
    } finally {
      setDeletingLectureId(null);
    }
  }

  async function sendItem(e) {
    e.preventDefault();

    if (!hall || !selectedSubj || !selectedDay || !startTime || !endTime) {
      alert("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }

    const payload = {
      course_id: selectedSubj,
      day_of_week: selectedDay,
      start_time: startTime,
      end_time: endTime,
      hall,
      is_active: isActive,
    };

    try {
      setIsSavingLecture(true);

      if (editingLecture) {
        const lectureId = getLectureId(editingLecture);

        if (!lectureId) {
          alert("لم يتم العثور على ID المحاضرة");
          return;
        }

        await api.put(`/class-schedule-items/${lectureId}`, payload);
      } else {
        await api.post(`/class-schedules/${id}/items`, payload);
      }

      resetLectureForm();

      await fetchSchedById(id);
    } catch (err) {
      console.log(err.response || err);
      alert("حدث خطأ أثناء حفظ المحاضرة");
    } finally {
      setIsSavingLecture(false);
    }
  }

  return (
    <div className="class-schedule">
      <Update
        page="updateSchedule"
        endPoint="class-schedules"
        pTitle="Schedule"
        allBtn="Schedules"
      />

      <div className="add-course">
        <h2>{editingLecture ? "تعديل محاضرة" : "إضافة محاضرة"}</h2>

        <form onSubmit={sendItem}>
          <Inputs title="القاعة" type="text" value={hall} setValue={setHall} />

          <Select
            title="المادة"
            value={selectedSubj}
            setValue={setSelectedSubj}
            items={scheduleCourses}
          />

          <Select
            title="اليوم"
            value={selectedDay}
            setValue={setSelectedDay}
            items={days}
          />

          <Inputs
            title="توقيت البدء"
            type="time"
            value={startTime}
            setValue={setStartTime}
          />

          <Inputs
            title="توقيت الانتهاء"
            type="time"
            value={endTime}
            setValue={setEndTime}
          />

          <IsActive isActive={isActive} setIsActive={setIsActive} />

          <div className="btn">
            <button type="submit" className="button" disabled={isSavingLecture}>
              {isSavingLecture
                ? "جاري الحفظ..."
                : editingLecture
                ? "حفظ التعديل"
                : "إضافة"}
            </button>

            {editingLecture && (
              <button
                type="button"
                className="button cancel-button"
                onClick={resetLectureForm}
              >
                إلغاء التعديل
              </button>
            )}
          </div>
        </form>
      </div>

      {isLoadingSchedById ? (
        <p>جاري تحميل برنامج الدوام...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th></th>

              {TIME_SLOTS.map((slot) => (
                <th key={slot.key}>
                  {slot.title}
                  <br />
                  {slot.start} - {slot.end}
                </th>
              ))}

              <th>تحديث</th>
            </tr>
          </thead>

          <tbody>
            {days.map((day) => (
              <tr key={day.id}>
                <td>{day.day}</td>

                {TIME_SLOTS.map((slot) => {
                  const lecture = findLecture(day.id, slot);
                  const lectureId = getLectureId(lecture);

                  return (
                    <td key={`${day.id}-${slot.key}`}>
                      {lecture ? (
                        <div className="lecture-card">
                          <div className="lecture-actions">
                            <button
                              type="button"
                              className="icon-button edit-icon"
                              title="تعديل المحاضرة"
                              onClick={() => handleEditClick(lecture)}
                            >
                              ✏️
                            </button>

                            <button
                              type="button"
                              className="icon-button delete-icon"
                              title="حذف المحاضرة"
                              disabled={deletingLectureId === lectureId}
                              onClick={() => handleDeleteClick(lecture)}
                            >
                              {deletingLectureId === lectureId ? "..." : "🗑️"}
                            </button>
                          </div>

                          <strong>{getCourseName(lecture, courses)}</strong>

                          <div>القاعة: {lecture.hall || "-"}</div>
                        </div>
                      ) : (
                        <span className="empty-slot">—</span>
                      )}
                    </td>
                  );
                })}

                <td></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}







// import { useEffect, useState } from "react";
// import Inputs from "../../Components/input/Input";
// import Update from "../CRUD/Update";
// import api from "../../Api/axios";
// import { useParams } from "react-router-dom";
// import Select from "../../Components/input/Select";
// import useDataStore, { days } from "../../../useDataStore";
// import IsActive from "../../Components/input/IsActive";

// export default function UpdateSchedule() {
//     const [scheduleData , setScheduleData] = useState([])
//     const [studyPlans , setStudyPlans] = useState([])
//     const [scheduleCourse , setScheduleCourse] = useState([])

//     const [hall , setHall] = useState("")
//     const [selectedSubj , setSelectedSubj] = useState()
//     const [selectedDay , setSelectedDay] = useState("")
//     const [startTime , setStartTime] = useState()
//     const [endTime , setEndTime] = useState()
//     const [isActive , setIsActive] = useState()

//     const { id } = useParams()

//     console.log(id)


//     const { courses , isLoadingCourses, fetchCourses } = useDataStore();
//     const { schedById , isLoadingSchedById, fetchSchedById } = useDataStore();

//     useEffect(() => {
//         if (courses.length === 0) fetchCourses();
//     }, [courses, fetchCourses]);

//     useEffect(() => {
//         if(id){fetchSchedById(id)}
//     },[id , fetchSchedById]);
//     console.log(schedById)







//     // let scheduleCourses
//     useEffect(() => {
//         let getStudyPlans = async () => {
//           try{
//                 let curSche = await api.get(`/class-schedules/${id}`)
//                 setScheduleData(curSche.data)
//                 let stPlan = await api.get('/study-plans')
//                 setStudyPlans(stPlan.data.data)
//                 // if(curSche.status === 200 & stPlan.status === 200){
                    
                    
//                 // }
//             }catch(err){
//             console.log(err.response)
//           }
//         }
//         getStudyPlans()
//     },[])
//      let scheduleCourses
//     // if(studyPlans && scheduleData ){
//     //     scheduleCourses = studyPlans.filter((plan) =>
//     //                 plan.program_id === scheduleData.program_id 
//     //                 && plan.study_year_id === scheduleData.study_year_id 
//     //                 && plan.semester_number === scheduleData.semester_number 
//     //                 && plan.specialization === scheduleData.specialization
//     //             ).map((plan => plan.courses))
//     // }
//     if (studyPlans && scheduleData) {
//         scheduleCourses = studyPlans
//         .filter((plan) => {
//             const mainMatch = plan.program_id === scheduleData.program_id && plan.semester_number === scheduleData.semester_number;
//             const planSpecId = plan.specialization_id || plan.specialization?.id || null;
//             const schedSpecId = scheduleData.specialization_id || scheduleData.specialization?.id || null;
//             const specMatch = planSpecId === schedSpecId;
//             return mainMatch && specMatch;
//         })
//         .flatMap((plan) => plan.courses || []); 
//     }




//     async function sendItem(e) {
//         let flag = true
//         e.preventDefault();
//         if(!hall || !selectedSubj || !selectedDay || !startTime || !endTime ){
//             flag = false
//         }else{
//             try{
//                 let res = await api.post(`class-schedules/${id}/items` , {
//                     "course_id": selectedSubj,
//                     "day_of_week": selectedDay,
//                     "start_time": startTime,
//                     "end_time": endTime,
//                     "hall": hall
//                 })
//             }catch(err){
//                 console.log(err.response)
//             }
//         }
//     }

//     console.log("first")


//     return (
//         <div className="class-schedule">
//             <Update page="updateSchedule" endPoint="class-schedules" pTitle="Schedule" allBtn="Schedules" />

//             <div className="add-course">
//             <h2>إضافة محاضرة</h2>
//             <form onSubmit={sendItem}>
//                 <Inputs title="القاعة" type="text" value={hall} setValue={setHall}/>
//                 <Select title="المادة" value={selectedSubj} setValue={setSelectedSubj} items={scheduleCourses}/>
//                 <Select title="اليوم" value={selectedDay} setValue={setSelectedDay} items={days}/>
//                 <Inputs title="توقيت البدء" type="time" value={startTime} setValue={setStartTime}/>
//                 <Inputs title="توقيت الانتهاء" type="time" value={endTime} setValue={setEndTime}/>
//                 <IsActive isActive = {isActive} setIsActive = {setIsActive}/>
//                 <div className="btn">
//                         <button type="submit" className="button" >إضافة</button>
//                 </div>
//             </form>
//             </div>
//             <table>
//                 <thead>
//                     <tr>
//                         <th></th>
//                         <th>المحاضرة الاولى <br /> 08:00 - 10:00</th>
//                         <th>المحاضرة الثانية<br /> 10:00 - 12:00</th>
//                         <th>المحاضرة الثالثة<br /> 12:00 - 14:00</th>
//                         <th>المحاضرة الرابعة<br /> 14:00 - 16:00</th>
//                         <th>تحديث</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     <tr>
//                         <td>الاحد</td>

//                     </tr>
//                     <tr>
//                         <td>الاثنين</td>
//                     </tr>
//                     <tr>
//                         <td>الثلاثاء</td>
//                     </tr>
//                     <tr>
//                         <td>الثلاثاء</td>
//                     </tr>
//                     <tr>
//                         <td>الثلاثاء</td>
//                     </tr>
//                     <tr>
//                         <td>الثلاثاء</td>
//                     </tr>
//                     <tr>
//                         <td>الثلاثاء</td>
//                     </tr>
//                 </tbody>
//             </table>
//         </div>
//     )
// }