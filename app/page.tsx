"use client";
import {useEffect,useState} from "react";
import Site from "./site";
import AdminClient from "./admin/admin-client";

export default function Home(){
 const [admin,setAdmin]=useState(false);
 useEffect(()=>{const sync=()=>setAdmin(location.hash==="#admin");queueMicrotask(sync);addEventListener("hashchange",sync);return()=>removeEventListener("hashchange",sync)},[]);
 return admin?<AdminClient/>:<Site/>;
}
