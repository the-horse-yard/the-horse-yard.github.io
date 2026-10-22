import numpy as np,json,subprocess as sp
from scipy.io import wavfile
from scipy import signal as sig
from pathlib import Path
P=Path(__file__).resolve().parent;S=48000;D=66.8;N=round(D*S);rng=np.random.default_rng(5786)
M=np.zeros((N,2));A=np.zeros_like(M);F=np.zeros_like(M);V=np.zeros_like(M)
def read(p):
 sr,x=wavfile.read(p);assert sr==S
 if x.ndim==1:x=np.column_stack([x,x])
 return x.astype(float)/(32768 if x.dtype==np.int16 else 1)
def add(dst,t,x,g=1,pan=0):
 if x.ndim==1:x=np.column_stack([x*np.sqrt((1-pan)/2),x*np.sqrt((1+pan)/2)])
 k=round(t*S);src=max(0,-k);k=max(0,k);n=min(len(x)-src,N-k)
 if n>0:dst[k:k+n]+=x[src:src+n]*g
def taper(x,d=.025):
 x=x.copy();n=min(round(d*S),len(x)//2);x[:n]*=np.linspace(0,1,n)[:,None];x[-n:]*=np.linspace(1,0,n)[:,None];return x
# Original 104 BPM D-major acoustic-like plucked score, composed for this edit.
B=60/104
chords=[[50,57,62,66,69],[47,54,59,62,66],[43,50,55,59,62],[45,52,57,61,64]]
def pluck(note,d=1.4):
 f=440*2**((note-69)/12);n=round(d*S);delay=round(S/f)
 excitation=np.zeros(n);excitation[:delay]=rng.uniform(-1,1,delay)
 b=np.zeros(delay+2);b[0]=1;a=np.zeros(delay+2);a[0]=1;a[delay]=-.493;a[delay+1]=-.493
 x=sig.lfilter(b,a,excitation);x=sig.sosfilt(sig.butter(2,6500,fs=S,output='sos'),x)
 x*=np.minimum(np.arange(n)/(S*.003),1);return x*.3
cache={note:pluck(note) for c in chords for note in c+[c[2]+12,c[3]+12]}
for bar in range(30):
 c=chords[bar%4];t=bar*4*B
 for j,ix in enumerate([0,2,3,1,4,2,3,4]):add(M,t+j*B/2,cache[c[ix]],.30 if j%2 else .38,pan=-.32 if j%2 else .28)
 # Soft round bass, sustained harmonic support.
 for beat in (0,2):
  u=np.arange(round(1.1*S))/S;f=440*2**((c[0]-12-69)/12);x=(np.sin(2*np.pi*f*u)+.18*np.sin(4*np.pi*f*u))*np.exp(-3*u)*np.minimum(u/.015,1)
  add(M,t+beat*B,x,.075)
 # Light shakers and brushed backbeat, never rock drums.
 for beat in np.arange(0,4,.5):
  u=np.arange(round(.09*S))/S;x=sig.sosfilt(sig.butter(2,[4500,10000],btype='bandpass',fs=S,output='sos'),rng.normal(size=len(u)))*np.sin(np.pi*u/.09)**2
  add(M,t+beat*B,x,.012,pan=.3 if beat%1 else -.3)
 for beat in (1,3):
  u=np.arange(round(.16*S))/S;x=sig.sosfilt(sig.butter(2,[700,4500],btype='bandpass',fs=S,output='sos'),rng.normal(size=len(u)))*np.exp(-35*u)*np.minimum(u/.003,1)
  add(M,t+beat*B,x,.03)
 # Sparse melodic answer, different from each arpeggio.
 if bar%2==1:
  for beat,note in [(1,c[2]+12),(2.5,c[3]+12)]:add(M,t+beat*B,cache[note],.22,pan=.1)
# Short stereo room around score, no wash over dialogue.
for delay,g,channel in [(.041,.16,0),(.067,.13,1),(.103,.07,0)]:
 k=round(delay*S);M[k:,channel]+=M[:-k,1-channel]*g
M*=.075/max(np.sqrt(np.mean(M*M)),1e-6)
tt=np.arange(N)/S
musicenv=np.zeros(N)
for start,end,g in [(4,24,.65),(35,56,.82),(61,66.8,.6)]:
 env=np.minimum(np.clip((tt-start)/1.0,0,1),np.clip((end-tt)/1.2,0,1));musicenv=np.maximum(musicenv,env*g)
# Sync production sound to the edit, including inverse mapping of speed ramps.
edl=json.loads((P/'edl.json').read_text());cue=[]
for q in edl:
 src=read(P/Path(q['file']).with_suffix('.wav'));d=q['duration'];s=q['speed'];t=np.arange(round(d*S))/S
 if q['ramp']:
  u=np.linspace(0,d*s,len(t));u=np.interp(t,u/s+.09*np.sin(2*np.pi*u/(d*s)),u)
 else:u=t*s
 ids=(q['source_start']+u)*S
 clip=np.column_stack([np.interp(ids,np.arange(len(src)),src[:,c]) for c in range(2)])
 clip=sig.sosfilt(sig.butter(2,[90,8500],btype='bandpass',fs=S,output='sos'),clip,axis=0)
 rms=np.sqrt(np.mean(clip*clip));clip*=np.clip(.045/max(rms,1e-5),.35,3)
 # Natural full-volume room in music-free passages; lower under score.
 local=musicenv[round(q['output_start']*S):round(q['output_start']*S)+len(clip)]
 clip*= (1-.38*local)[:,None]
 add(A,q['output_start'],taper(clip,.04))
 # 180 ms audio anticipation and 140 ms tails make J/L cuts.
 if q['index']>2:
  k=round(q['source_start']*S);pre=src[max(0,k-8640):k]
  if len(pre):add(A,q['output_start']-len(pre)/S,taper(pre,.03),.18)
 # Reinforce recorded low-frequency hoof transients with a soft sand/body layer.
 low=sig.sosfilt(sig.butter(2,[90,420],btype='bandpass',fs=S,output='sos'),clip.mean(axis=1))
 env=np.sqrt(sig.convolve(low*low,np.ones(480)/480,mode='same'))
 peaks,_=sig.find_peaks(env,height=max(.012,np.quantile(env,.88)),distance=round(.30*S),prominence=.004)
 if q['index'] not in (3,4,20):
  for k in peaks:
   u=np.arange(round(.11*S))/S;body=np.sin(2*np.pi*(135*u-100*u*u))*np.exp(-42*u);sand=sig.sosfilt(sig.butter(2,[500,3300],btype='bandpass',fs=S,output='sos'),rng.normal(size=len(u)))*np.exp(-48*u)
   add(F,q['output_start']+k/S,(body*.045+sand*.016)*np.minimum(u/.002,1));cue.append(round(q['output_start']+k/S,3))
# Two cinematic punctuation hits, not continual booms under beginner riding.
def impact():
 t=np.arange(round(2.3*S))/S
 dry=(.20*np.sin(2*np.pi*(38*t+34*(1-np.exp(-9*t))/9))*np.exp(-4*t)+.035*np.sin(2*np.pi*677*t)*np.exp(-5*t)+.018*np.sin(2*np.pi*1129*t)*np.exp(-3*t))*np.minimum(t/.002,1)
 x=np.column_stack([dry,dry])
 for j,(delay,g) in enumerate([(.09,.25),(.19,.19),(.33,.14),(.51,.1),(.79,.07),(1.15,.035)]):
  k=round(delay*S);x[k:,j%2]+=dry[:-k]*g
 return x
for t,g in [(0,.7),(39,.65)]:
 x=impact();add(F,t,x,g)
 if t:add(F,t-.55,x[:26400][::-1]*np.linspace(0,1,26400)[:,None],.20)
for at in (2,22.5,42,55.8):
 u=np.arange(round(.65*S))/S;noise=sig.sosfilt(sig.butter(2,[800,7000],btype='bandpass',fs=S,output='sos'),rng.normal(size=len(u)))
 y=noise*np.sin(np.pi*u/.65)**2*.035;pan=u/.65
 add(F,at-.325,np.column_stack([y*np.cos(pan*np.pi/2),y*np.sin(pan*np.pi/2)]))
voice_times=[3.3,18.8,36.3,61.2];voice_d=[]
for i,at in enumerate(voice_times):
 sp.run(['ffmpeg','-nostdin','-y','-v','error','-i',str(P/f'vo-{i}.mp3'),'-ar',str(S),'-ac','2',str(P/f'vo-{i}.wav')],check=True)
 v=read(P/f'vo-{i}.wav');v=sig.sosfilt(sig.butter(2,100,btype='highpass',fs=S,output='sos'),v,axis=0);v*=.115/max(np.sqrt(np.mean(v*v)),1e-5);add(V,at,taper(v));end=at+len(v)/S;voice_d.append([at,end])
 duck=np.minimum(np.clip((tt-(at-.22))/.22,0,1),np.clip((end+.45-tt)/.45,0,1));musicenv*=10**(-11*duck/20);A*=10**(-7*duck[:,None]/20)
M*=musicenv[:,None]
mix=M+A+F+V;mix[-round(.9*S):]*=np.linspace(1,0,round(.9*S))[:,None]
for name,x in [('score',M),('production',A),('foley-effects',F),('voiceover',V),('premix',mix)]:wavfile.write(P/(name+'.wav'),S,x.astype('float32'))
(P/'sound-cues.json').write_text(json.dumps({'music':'Original synthesized plucked score, 104 BPM, D major','music_windows':[[4,24],[35,56],[61,66.8]],'voice_times':voice_d,'foley_seconds':cue,'impact_seconds':[0,39],'voice':'Synthetic English narration, Sonia','target_lufs':-14},indent=2))
r=sp.run(['ffmpeg','-nostdin','-hide_banner','-i',str(P/'premix.wav'),'-af','loudnorm=I=-14:TP=-3:LRA=10:print_format=json','-f','null','-'],capture_output=True,text=True,check=True);m=json.loads(r.stderr[r.stderr.rfind('{'):]);f='loudnorm=I=-14:TP=-3:LRA=10:measured_I={input_i}:measured_TP={input_tp}:measured_LRA={input_lra}:measured_thresh={input_thresh}:offset={target_offset}:linear=true:print_format=json'.format(**m)
r=sp.run(['ffmpeg','-nostdin','-y','-i',str(P/'premix.wav'),'-af',f,'-ar','48000','-c:a','pcm_s24le',str(P/'mix-final.wav')],capture_output=True,text=True,check=True);(P/'mix-meter.log').write_text(r.stderr)
print('Sound mix complete',flush=True)
