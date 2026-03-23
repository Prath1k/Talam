async function test() {
    const cleanTitle = "Emai Poyave";
    try {
      const saavnRes = await fetch(`https://jiosaavn-api-privatecvc2.vercel.app/search/songs?query=${encodeURIComponent(cleanTitle)}&limit=1`);
      if (saavnRes.ok) {
        const saavnData = await saavnRes.json();
        const res = saavnData.data.results[0];
        console.log("Image type:", typeof res.image);
        console.log("Is array:", Array.isArray(res.image));
        console.log("Image value:", JSON.stringify(res.image));
      }
    } catch (e) {
      console.log("Error", e);
    }
}
test();
