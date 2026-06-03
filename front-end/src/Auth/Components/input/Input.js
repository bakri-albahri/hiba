export default function Inputs(props){
    return(
        <>
     
        <div className="input">
            <label htmlFor={props.title}> {props.title} : </label>
            <input 
                id={props.title} 
                type={props.type} 
                placeholder={props.title + "..."}
                value={props.value} 
                onChange={(e) => props.setValue(e.target.value)} />
            {/* {!fName & accept ? <p className="form-error">Full Name Is Required !</p> : ""} */}
        </div> 
        
   </>
    )
    
}