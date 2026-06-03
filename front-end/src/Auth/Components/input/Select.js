export default function SelectForm(props){
    return(
        <div className="input">
            <label htmlFor={props.title}>{props.title}</label>
            <select
            id={props.title}
            value={props.value || ""}
            onChange={(e) => props.setValue(e.target.value)}
            className="select-items"
            >
                <option value="">اختر {props.title}</option>
                {props.items?.map((item, index) => (
                    
                        props.title === "Course" ? <option value={props.sendValue === "code" ? item.code : item.id} key={index}>{item.name}</option>
                        : props.title === "Program" ? <option value={item.id} key={index}>{item.name}</option>
                        : props.title === "StudyYear" ? <option value={item.id} key={index}>{item.name}</option>
                        : props.title === "Specialization" ? <option value={item.id} key={index}>{item.name}</option>
                        : props.title === "اليوم" ? <option value={item.id} key={index}>{item.day}</option>
                        : props.title === "Academic Year" ? <option value={item.id} key={index}>{item.name}</option>
                        : ""
                    
                ))}
                {props.title === "Semster" &&
                    <>
                        <option value="1" >1</option> 
                        <option value="2" >2</option>
                    </>
                }
                {props.title === "Grade" &&
                    <>
                        <option value="coursework_mark" >coursework_mark</option> 
                        <option value="practical_mark" >practical_mark</option>
                        <option value="exam_mark" >exam_mark</option>
                    </>
                }
            </select>
        </div>
    )
}