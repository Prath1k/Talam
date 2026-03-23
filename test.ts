const files = import.meta.glob('/public/music/**/*.{mp3,mp4,m4a,wav}');
console.log(Object.keys(files));
