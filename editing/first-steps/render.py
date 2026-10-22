from pathlib import Path
import subprocess as sp,json,concurrent.futures,os
P=Path(__file__).resolve().parent;SRC=P.parent/'upload';os.environ['OMP_NUM_THREADS']='1'
# file, source start, output duration, speed, crop zoom, x/y anchor
shots=[(5797,2,1,1,1.22,.45,.6),(5798,.4,1,1,1.18,.4,.3),(5800,3,1,1,1.05,.5,.5),(5786,7.6,4.5,.85,1.22,.78,.35),(5786,33.5,3.5,1,1.08,.55,.4),(5791,10.5,4,1,1.1,.5,.5),(5797,1,4,.85,1.06,.5,.5),(5798,12.5,3.5,1,1.08,.7,.4),(5794,1,3,1,1.05,.5,.5),(5796,2.2,3.5,1,1.05,.5,.5),(5795,3.5,3,1,1.05,.5,.5),(5797,9,4,1,1.03,.5,.5),(5798,20,3,1,1.04,.5,.5),(5799,.1,3,1,1.08,.5,.5),(5799,10.3,2,1,1.06,.5,.5),(5800,1.8,3,1,1.05,.5,.5),(5791,30.2,3,1,1.08,.5,.5),(5797,16.3,2.8,.8,1.04,.5,.5),(5798,23,3,.8,1.04,.5,.5),(5800,16,3,1,1.04,.5,.5),(5786,55.5,4,.85,1.13,.55,.45),(5794,7,4,1,1.04,.5,.5)]
edl=[];at=0
for i,(n,start,d,s,z,x,y) in enumerate(shots):
 edl.append(dict(index=i,file=f'IMG_{n}.MOV',source_start=start,duration=d,speed=s,zoom=z,x=x,y=y,output_start=at,ramp=i in (13,15)));at+=d
(P/'edl.json').write_text(json.dumps(edl,indent=2));print('Duration',at,flush=True)
def run(a):
 r=sp.run(['ffmpeg','-nostdin','-y','-v','error','-threads','2','-filter_threads','1']+a,capture_output=True,text=True)
 if r.returncode:raise RuntimeError(r.stderr[-2500:])
def render(q):
 i=q['index'];d=q['duration'];s=q['speed'];start=q['source_start'];trf=P/f'stab{i}.trf'
 common=['-ss',str(start),'-t',str(d*s+.15),'-i',str(SRC/q['file']),'-an']
 run(common+['-vf',f'vidstabdetect=shakiness=3:accuracy=9:result={trf}','-f','null','-'])
 z=q['zoom'];w=round(1920/z/2)*2;h=round(1080/z/2)*2
 pts=f'(PTS-STARTPTS)/{s}'
 if q['ramp']:pts=f'((T-STARTT)/{s}+0.09*sin(2*PI*(T-STARTT)/{d*s}))/TB'
 vf=f"vidstabtransform=input={trf}:smoothing=10:optzoom=1:zoom=1:maxangle=0.025:maxshift=35,crop={w}:{h}:(iw-ow)*{q['x']}:(ih-oh)*{q['y']},scale=1920:1080:flags=lanczos,setpts={pts},fps=30,setsar=1,eq=contrast=1.035:brightness=0.018:saturation=0.86:gamma=1.035,colorbalance=rh=0.014:bh=-0.012,unsharp=5:5:0.22:5:5:0"
 run(common+['-vf',vf,'-frames:v',str(round(d*30)),'-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-threads','2',str(P/f'shot{i:02}.mp4')])
 print('Shot',i+1,'/',len(edl),flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as ex:list(ex.map(render,edl))
# Two restrained dissolves; all other joins are action / match / jump cuts.
def dissolve(a,b,d,name):
 da=edl[a]['duration'];f=f'[0:v]settb=AVTB,setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration={d}[a];[1:v]settb=AVTB,setpts=PTS-STARTPTS[b];[a][b]xfade=transition=fade:duration={d}:offset={da},format=yuv420p[v]'
 run(['-i',str(P/f'shot{a:02}.mp4'),'-i',str(P/f'shot{b:02}.mp4'),'-filter_complex_threads','1','-filter_complex',f,'-map','[v]','-frames:v',str(round((da+edl[b]['duration'])*30)),'-c:v','libx264','-preset','fast','-crf','20','-threads','2',str(P/name)])
dissolve(4,5,.23,'join04.mp4');dissolve(20,21,.4,'join20.mp4')
names=[]
for i in range(len(edl)):
 if i in (5,21):continue
 names.append('join04.mp4' if i==4 else 'join20.mp4' if i==20 else f'shot{i:02}.mp4')
(P/'concat.txt').write_text('\n'.join("file '%s'"%n for n in names))
run(['-f','concat','-safe','0','-i',str(P/'concat.txt'),'-c','copy',str(P/'picture-verified.mp4')]);print('Picture complete',flush=True)
