/* Clinical service withdrawn during evidence review; archived source retained locally. */
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(!['POST'].includes(req.method)){res.setHeader('Allow',['POST'].join(', '));return res.status(405).end();}
 return res.status(503).json({error:'Clinical tools are unavailable during evidence review. Saved plans are retained.'});
}
