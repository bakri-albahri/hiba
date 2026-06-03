export default function Semster(props){
    return(
        <div className="input">
            <label htmlFor="Semster">Semster : </label>
            <select
            id="Semster"
            onChange={(e) => props.setSemNum(e.target.value)}
            className="select-items"
            >
                <option value="None" >Select Semster</option>
                <option value="1" >1</option>
                <option value="2" >2</option>
            </select>
            {/* {!props.currentStudyYear & props.accept ? <p className="form-error"> Study Year Is Required !</p> : ""} */}
        </div>
    )
}