"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function OptimizationPage() {

const [verilog,setVerilog] = useState("")
const [optimized,setOptimized] = useState("")


useEffect(() => {

const code = localStorage.getItem("verilog_code")

if (code) {
setVerilog(code)
}

}, [])



const optimize = async()=>{

const response = await fetch(
"http://localhost:8001/optimize",
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
verilog:verilog
})
}
)

const data = await response.json()

setOptimized(data.optimized)

}



const sendToSimulation = ()=>{

if(!optimized){
alert("Optimize code first")
return
}

localStorage.setItem("verilog_code",optimized)

setVerilog("")
setOptimized("")

window.location.href="/dashboard/simulation"

}


return(

<div className="p-10">

<h1 className="text-3xl mb-5">
Optimization Page
</h1>


<div className="grid grid-cols-2 gap-5">


<div>

<h2 className="mb-2">
Generated Code
</h2>

<textarea
className="w-full h-96 bg-black text-green-400 p-4"
value={verilog}
onChange={(e)=>setVerilog(e.target.value)}
/>

</div>


<div>

<h2 className="mb-2">
Optimized Code
</h2>

<textarea
className="w-full h-96 bg-black text-cyan-400 p-4"
value={optimized}
onChange={(e)=>setOptimized(e.target.value)}
/>

</div>


</div>


<div className="mt-5 flex gap-3">

<Button onClick={optimize}>
Optimize
</Button>

<Button onClick={sendToSimulation}>
Send To Simulation
</Button>

<Button
variant="destructive"
onClick={()=>{
setVerilog("")
setOptimized("")
}}
>
Clear
</Button>

</div>

</div>

)

}