import React, { useState } from 'react';

export default function App() {
  const [page, setPage] = useState('dashboard');

  return (
    <div style={{display:'flex',minHeight:'100vh',fontFamily:'sans-serif'}}>
      <aside style={{width:240,padding:20,borderRight:'1px solid #eee'}}>
        <h2>XPS</h2>
        {['dashboard','admin','systems','assistant','env'].map(p => (
          <div key={p} onClick={()=>setPage(p)} style={{padding:8,cursor:'pointer'}}>
            {p}
          </div>
        ))}
      </aside>
      <main style={{flex:1,padding:24}}>
        <h1>{page}</h1>
        <p>Frontend shell active. Backend + auth not yet wired.</p>
      </main>
    </div>
  );
}
