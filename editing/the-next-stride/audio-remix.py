from pathlib import Path
import numpy as np
from scipy.io import wavfile
from scipy import signal as sig
import subprocess as sp,json
P=Path(__file__).resolve().parent; S=48000; N=56*S
rng=np.random.default_rng(20261021)
def read(p):
 s,x=wavfile.read(p); assert s==S
 return x.astype('float32')/(32768 if x.dtype==np.int16 else 1)
rock=read(P/'rock.wav'); arena=read(P/'arena.wav')
music=np.zeros((N,2));foley=np.zeros_like(music);fx=np.zeros_like(music)
def add(dst,t,x,g=1):
 k=round(t*S); a=max(0,-k);k=max(0,k);n=min(len(x)-a,N-k)
 if n>0:dst[k:k+n]+=x[a:a+n]*g
def fade(x,d=.012):
 n=min(round(d*S),len(x)//2);x=x.copy();x[:n]*=np.linspace(0,1,n)[:,None];x[-n:]*=np.linspace(1,0,n)[:,None];return x
at=0
for start,d in [(0,7.5),(7.5,7.5),(18.75,11.25),(45,7.5),(52.5,11.25),(67.5,11.25),(78,3.75)]:
 add(music,at,fade(rock[round(start*S):round((start+d)*S)]));at+=d
shots=[(27.3,84,.5),(40.8,28,.75),(2,112,1),(10,112,1),(25.5,112,1),(38.5,112,.8),(43,112,1),(55,56,1),(62,56,1),(67,112,.6),(72,112,1),(79,112,.8),(82,112,1),(27.8,56,.5),(40.8,56,.65),(82.5,112,.6),(88,112,1),(93,112,1)]
arena=sig.sosfilt(sig.butter(3,[110,4800],btype='bandpass',fs=S,output='sos'),arena,axis=0)
at=0
for i,(start,frames,speed) in enumerate(shots):
 d=frames/30;t=np.arange(round(d*S))/S
 if i in (4,8,12):
  u=np.linspace(0,d*speed,len(t));elapsed=np.interp(t,u/speed+.08*np.sin(2*np.pi*u/(d*speed)),u)
 else:elapsed=t*speed
 ids=(start+elapsed)*S
 x=np.column_stack([np.interp(ids,np.arange(len(arena)),arena[:,c]) for c in range(2)])
 # Transient expansion brings forward genuine hoof attacks and lowers ambient wash.
 env=np.sqrt(sig.convolve(np.mean(x*x,axis=1),np.ones(960)/960,mode='same'))
 ref=max(np.quantile(env,.82),.0001);gate=np.clip(env/ref,.12,1)**1.5
 x*=gate[:,None];r=np.sqrt(np.mean(x*x));x*=min(5,.04/max(r,1e-6))
 add(foley,at,fade(x,.035),.85 if i in (0,4,12,13,15) else .35);at+=d
# Hero cues are tied to the existing picture, not the score's bar boundaries.
landings=[2.3,14.3,39.05,42.18,46.78]
ducks=[]
def impact():
 t=np.arange(int(2.4*S))/S
 sub=np.sin(2*np.pi*(39*t+35*(1-np.exp(-9*t))/9))*np.exp(-3.8*t)*.5
 metal=sum(g*np.sin(2*np.pi*f*t)*np.exp(-dec*t) for f,g,dec in [(613,.085,5),(997,.06,4),(1463,.035,3.2)])
 grit=sig.sosfilt(sig.butter(2,[300,3800],btype='bandpass',fs=S,output='sos'),rng.normal(size=len(t)))*np.exp(-40*t)*.21
 dry=(sub+metal+grit)*np.minimum(t/.002,1);x=np.column_stack([dry,dry])
 for j,(delay,g) in enumerate([(.061,.27),(.113,.22),(.179,.19),(.263,.15),(.397,.12),(.563,.085),(.797,.06), (1.07,.035)]):
  k=round(delay*S);x[k:,j%2]+=dry[:-k]*g
 return x
for t in landings:
 imp=impact();add(fx,t,imp,.8);add(fx,t+.11,impact(),.16)
 rev=imp[:round(.55*S)][::-1].copy()*np.linspace(0,1,round(.55*S))[:,None]
 add(fx,t-.64,rev,.22);ducks.append((t-.65,t+.35, -13))
# A restrained opening hit; transition air travels across the stereo field.
add(fx,0,impact(),.45);ducks.append((0,.45,-9))
for t in [2.8,11.2,24.266667,37.333333,44.8,52.266667]:
 d=.8;u=np.arange(round(d*S))/S
 noise=sig.sosfilt(sig.butter(2,[800,7000],btype='bandpass',fs=S,output='sos'),rng.normal(size=len(u)))
 y=noise*np.sin(np.pi*u/d)**2*.085
 add(fx,t-.4,np.column_stack([y*np.cos(u/d*np.pi/2),y*np.sin(u/d*np.pi/2)]));ducks.append((t-.35,t+.15,-8))
# Smooth manual automation, fast preparation and slower recovery.
gain=np.zeros(N);tt=np.arange(N)/S
for start,end,db in ducks:
 a=np.clip((tt-(start-.16))/.16,0,1);b=np.clip((end+.72-tt)/.72,0,1)
 env=np.minimum(a,b);env=env*env*(3-2*env);gain=np.minimum(gain,db*env)
music*=10**(gain[:,None]/20)*.62
mix=music+foley+fx
mix[-int(1.5*S):]*=np.linspace(1,0,int(1.5*S))[:,None]
for name,x in [('music-automated',music),('foley',foley),('designed-fx',fx),('premix',mix)]:wavfile.write(P/(name+'.wav'),S,x.astype('float32'))
(P/'cues.json').write_text(json.dumps({'duration':56,'landings_seconds':landings,'ducking_db':[-13,-8],'attack_seconds':.16,'release_seconds':.72,'picture':'copied without re-encoding','sources':'existing rock arrangement, original arena recording, synthesized effects'},indent=2))
r=sp.run(['ffmpeg','-hide_banner','-i',str(P/'premix.wav'),'-af','loudnorm=I=-14:TP=-3:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
m=json.loads(r.stderr[r.stderr.rfind('{'):]);f='loudnorm=I=-14:TP=-3:LRA=11:measured_I={input_i}:measured_TP={input_tp}:measured_LRA={input_lra}:measured_thresh={input_thresh}:offset={target_offset}:linear=true:print_format=json'.format(**m)
r=sp.run(['ffmpeg','-y','-i',str(P/'premix.wav'),'-af',f,'-ar','48000','-c:a','pcm_s24le',str(P/'mix-final.wav')],capture_output=True,text=True,check=True);(P/'metering.log').write_text(r.stderr)
for src,dst,rate in [('Next-Stride-Master.mp4','Next-Stride-Master.mp4','256k'),('web-original.mp4','the-next-stride.mp4','128k')]:
 sp.run(['ffmpeg','-y','-v','error','-i',str(P/'input'/src),'-i',str(P/'mix-final.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a',rate,'-ar','48000','-movflags','+faststart',str(P/dst)],check=True)
print('Remix rendered, picture stream copied',flush=True)
