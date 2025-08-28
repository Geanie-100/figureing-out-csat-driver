"use client";

import React, { useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, FileText } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis, ResponsiveContainer, Scatter, ScatterChart, ZAxis } from "recharts";
import * as htmlToImage from "html-to-image";
import Papa from "papaparse";
import { create, all } from "mathjs";
import jsPDF from "jspdf";

const math = create(all, {});

const DEFAULT_COLS = {
  overall: "Overall, how satisfied are you with Townsend?",
  search: "SEARCH experience",
  export: "EXPORT experience",
  change: "CHANGE MANAGEMENT experience",
  group: "Group",
};

const SCORE_MAP = {
  "A. Extremely satisfied": 5,
  "B. Somewhat satisfied": 4,
  "C. Neither satisfied nor dissatisfied": 3,
  "D. Somewhat dissatisfied": 2,
  "E. Extremely dissatisfied": 1,
  "F. N/A (I do not use this feature)": null,
};

function mapScore(v) {
  if (v == null) return null;
  const t = String(v).trim();
  if (SCORE_MAP.hasOwnProperty(t)) return SCORE_MAP[t];
  const letter = t[0]?.toUpperCase();
  if (["A","B","C","D","E"].includes(letter)) {
    return {A:5,B:4,C:3,D:2,E:1}[letter];
  }
  const num = Number(t);
  return Number.isFinite(num) ? num : null;
}

function mean(arr) {
  const vals = arr.filter(x => typeof x === "number" && Number.isFinite(x));
  return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : NaN;
}

function ols(X, y) {
  const XT = math.transpose(X);
  const XTX = math.multiply(XT,X);
  const XTX_inv = math.inv(XTX);
  const XTy = math.multiply(XT,y);
  const beta = math.multiply(XTX_inv,XTy);
  const y_mean = mean(y);
  const x_means = math.mean(X,0);
  const intercept = y_mean - beta.reduce((acc,b,i)=>acc+b*x_means[i],0);
  const yhat = X.map(row=>beta.reduce((acc,b,j)=>acc+b*row[j],intercept));
  const ss_res = y.reduce((acc,yi,i)=>acc+Math.pow(yi-yhat[i],2),0);
  const ss_tot = y.reduce((acc,yi)=>acc+Math.pow(yi-y_mean,2),0);
  const r2 = ss_tot===0?0:1-ss_res/ss_tot;
  return {beta:Array.from(beta), intercept, r2};
}

function sanitizeAndFit(data, cols, segment) {
  const isLab = segment==="Lab";
  const rows = data.filter(r=> (isLab ? r[cols.group]==="Lab" : r[cols.group]!=="Lab"));
  const y_raw = rows.map(r=>mapScore(r[cols.overall]));
  const x_search = rows.map(r=>mapScore(r[cols.search]));
  const x_export = rows.map(r=>mapScore(r[cols.export]));
  const x_change = rows.map(r=>mapScore(r[cols.change]));
  const keepMask = rows.map((_,i)=> y_raw[i]!=null && [x_search[i],x_export[i],x_change[i]].some(v=>v!=null));
  const y = y_raw.filter((_,i)=>keepMask[i]);
  const X_partial = [x_search,x_export,x_change].map(col=>col.filter((_,i)=>keepMask[i]));
  const colMeans = X_partial.map(col=>mean(col));
  const X = Array(y.length).fill(0).map((_,rowIdx)=>X_partial.map((col,j)=>col[rowIdx]==null?colMeans[j]:col[rowIdx]));
  const xMeans = math.mean(X,0);
  const xStd = math.std(X,0,"uncorrected").map(s=>s===0?1:s);
  const Xz = X.map(row=>row.map((v,j)=>(v-xMeans[j])/xStd[j]));
  const {beta, intercept, r2} = ols(Xz,y);
  return {columns:[cols.search,cols.export,cols.change],beta_std:beta,intercept,n:y.length,r2,xStd,y_mean:mean(y)};
}

function normalize(arr){const s=arr.reduce((a,b)=>a+b,0);return s===0?arr.map(()=>0):arr.map(v=>v/s);}
function toPcnt(v,d=1){return `${(v*100).toFixed(d)}%`;}

function predictedDelta(beta,xStd,deltas){return beta.reduce((acc,b,i)=>acc+b*(deltas[i]/(xStd[i]||1)),0);}

function WhatIfPanel({results}){
  const [dSearch,setDSearch]=useState(0);
  const [dExport,setDExport]=useState(0);
  const [dChange,setDChange]=useState(0);
  const deltas=[dSearch,dExport,dChange];

  const awsDy=predictedDelta(results.aws.beta_std,results.aws.xStd,deltas);
  const labDy=predictedDelta(results.lab.beta_std,results.lab.xStd,deltas);
  const awsY=results.aws.y_mean+awsDy;
  const labY=results.lab.y_mean+labDy;

  // linear mapping calibration from earlier fit
  const awsSlope=(0.816-0.602)/(4.038-3.746);
  const labSlope=(0.816-0.602)/(4.038-3.746); // reuse slope as approx
  const awsPct=0.602+(awsY-3.746)*awsSlope;
  const labPct=0.816+(labY-4.038)*labSlope;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="p-4 rounded-2xl border space-y-2">
        <h3 className="font-semibold">Adjust Feature Improvements (Δ points)</h3>
        <Label>{results.featureKeys[0]}</Label>
        <Input type="number" step="0.1" value={dSearch} onChange={e=>setDSearch(Number(e.target.value))}/>
        <Label>{results.featureKeys[1]}</Label>
        <Input type="number" step="0.1" value={dExport} onChange={e=>setDExport(Number(e.target.value))}/>
        <Label>{results.featureKeys[2]}</Label>
        <Input type="number" step="0.1" value={dChange} onChange={e=>setDChange(Number(e.target.value))}/>
      </div>
      <div className="space-y-4">
        <div className="p-4 rounded-2xl border">
          <h3 className="font-semibold">AWS Projection</h3>
          <p>New mean ≈ {awsY.toFixed(2)} → Est. CSAT ≈ {(awsPct*100).toFixed(1)}%</p>
        </div>
        <div className="p-4 rounded-2xl border">
          <h3 className="font-semibold">Lab Projection</h3>
          <p>New mean ≈ {labY.toFixed(2)} → Est. CSAT ≈ {(labPct*100).toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
}

export default function Page(){
  const [rawRows,setRawRows]=useState(null);
  const [cols,setCols]=useState(DEFAULT_COLS);
  const [usage,setUsage]=useState({[DEFAULT_COLS.search]:6211,[DEFAULT_COLS.export]:434,[DEFAULT_COLS.change]:4731});
  const [error,setError]=useState(null);
  const chartRefBar=useRef(null);
  const chartRefBubble=useRef(null);

  function onUpload(file){
    setError(null);
    Papa.parse(file,{header:true,skipEmptyLines:true,complete:(res)=>setRawRows(res.data),error:(err)=>setError(String(err))});
  }

  const results=useMemo(()=>{
    if(!rawRows) return null;
    try{
      const aws=sanitizeAndFit(rawRows,cols,"AWS");
      const lab=sanitizeAndFit(rawRows,cols,"Lab");
      const featureKeys=[cols.search,cols.export,cols.change];
      const usageArr=featureKeys.map(k=>usage[k]||0);
      const maxUsage=Math.max(...usageArr,1);
      const usageNorm=usageArr.map(u=>u/maxUsage);
      const awsWeighted=normalize(aws.beta_std.map((b,i)=>Math.abs(b)*usageNorm[i]));
      const labWeighted=normalize(lab.beta_std.map((b,i)=>Math.abs(b)*usageNorm[i]));
      return {featureKeys,aws,lab,usageArr,usageNorm,awsWeighted,labWeighted};
    }catch(e){setError(String(e));return null;}
  },[rawRows,cols,usage]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">CSAT Feature Importance Analyzer</h1>
      <Card><CardContent className="p-4"><Label>Upload Survey CSV</Label><Input type="file" accept=".csv" onChange={e=>e.target.files&&onUpload(e.target.files[0])}/></CardContent></Card>
      {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      {results && <Card><CardContent className="p-4"><Tabs defaultValue="summary"><TabsList><TabsTrigger value="summary">Summary</TabsTrigger><TabsTrigger value="bar">Weighted Bars</TabsTrigger><TabsTrigger value="bubble">Impact vs Usage</TabsTrigger><TabsTrigger value="whatif">What-If</TabsTrigger></TabsList><TabsContent value="whatif"><WhatIfPanel results={results}/></TabsContent></Tabs></CardContent></Card>}
    </div>
  );
}
