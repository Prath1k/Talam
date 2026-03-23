async function test() {
    const cleanTitle = "Emai Poyave Padi Padi Leche Manasu Sharwanand Sai Pallavi Vishal Chandrashekar  128KBPS"
      .replace(/128KBPS|320KBPS|192KBPS|Video|Song|Full|HD|4K|Lyrics|Lyrical/gi, "")
      .replace(/_/g, " ")
      .trim();
    console.log("Query:", cleanTitle);
    try {
      const saavnRes = await fetch(`https://jiosaavn-api-privatecvc2.vercel.app/search/songs?query=${encodeURIComponent(cleanTitle)}&limit=1`);
      console.log("Status:", saavnRes.status);
      if (saavnRes.ok) {
        const saavnData = await saavnRes.json();
        if (saavnData.status === "SUCCESS" && saavnData.data && saavnData.data.results && saavnData.data.results.length > 0) {
          console.log("Result:", saavnData.data.results[0].name);
        } else {
          console.log("No results in data", JSON.stringify(saavnData).substring(0, 200));
        }
      }
    } catch (e) {
      console.log("Error", e);
    }
}
test();
