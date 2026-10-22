from pathlib import Path
import subprocess as sp
P=Path(__file__).resolve().parent
vf=f"drawbox=x=0:y=0:w=iw:h=ih:color=black@0.30:t=fill:enable='gte(t,62.8)',ass={P/'titles.ass'},fade=t=out:st=66.1:d=0.7"
def run(a):sp.run(['ffmpeg','-nostdin','-y','-v','error','-threads','2','-filter_threads','1']+a,check=True)
run(['-i',str(P/'picture-verified.mp4'),'-i',str(P/'mix-final.wav'),'-map','0:v:0','-map','1:a:0','-vf',vf,'-c:v','libx264','-preset','fast','-crf','21','-maxrate','4000k','-bufsize','8000k','-threads','3','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-ar','48000','-movflags','+faststart','-metadata','title=First Steps','-metadata','artist=The Horse Yard',str(P/'First-Steps-Master.mp4')]);print('Master rendered',flush=True)
run(['-i',str(P/'First-Steps-Master.mp4'),'-vf','scale=1280:720:flags=lanczos','-c:v','libx264','-preset','fast','-crf','24','-maxrate','1150k','-bufsize','2300k','-threads','3','-c:a','aac','-b:a','128k','-movflags','+faststart',str(P/'first-steps.mp4')]);print('Web rendered',flush=True)
run(['-ss','17','-i',str(P/'First-Steps-Master.mp4'),'-vf',"scale=1280:720,drawbox=x=0:y=0:w=iw:h=150:color=black@0.25:t=fill,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf:text='FIRST STEPS':fontsize=46:fontcolor=white:x=50:y=45",'-frames:v','1','-q:v','3',str(P/'first-steps.jpg')]);print('Poster rendered',flush=True)
