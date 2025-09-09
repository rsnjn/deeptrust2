export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method === 'POST') {
    const { url, type } = req.body;
    
    // Simulate deepfake analysis
    const analyses = [
      { score: 82, reason: "unnatural face boundaries and lighting inconsistencies" },
      { score: 67, reason: "suspicious blur patterns around jaw and hairline" },
      { score: 45, reason: "minor artifacts detected but could be compression" },
      { score: 23, reason: "natural facial features with authentic textures" },
      { score: 91, reason: "clear AI generation markers in facial symmetry" },
      { score: 38, reason: "some irregularities but likely from photo editing" }
    ];
    
    const randomAnalysis = analyses[Math.floor(Math.random() * analyses.length)];
    
    const explanation = `The image shows ${randomAnalysis.score}% deepfake probability. Analysis detected ${randomAnalysis.reason}. ${
      randomAnalysis.score > 70 
        ? "This content appears to be artificially generated or heavily manipulated." 
        : randomAnalysis.score > 40
        ? "Some suspicious elements detected - further inspection recommended."
        : "The content appears to be authentic with natural characteristics."
    }`;
    
    res.status(200).json({
      deepfake_score: randomAnalysis.score,
      explanation: explanation,
      suspicious_regions: [],
      version: "1.0"
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
