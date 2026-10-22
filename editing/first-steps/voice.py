import edge_tts,edge_tts.communicate,asyncio,os
from pathlib import Path
edge_tts.communicate._SSL_CTX.load_verify_locations(cafile=os.environ['SSL_CERT_FILE'])
lines=['Every journey starts with a first step.','A little guidance. A little trust.','And then, you find your rhythm.','Your story starts here. Ride with us.']
async def main():
 for i,t in enumerate(lines):
  await edge_tts.Communicate(t,'en-GB-SoniaNeural',rate='-8%').save(f'first-steps/vo-{i}.mp3')
  print('Voice',i,flush=True)
asyncio.run(main())
