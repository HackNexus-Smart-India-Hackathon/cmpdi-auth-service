import express from "express"
import axios from 'axios'
const router = express.Router()


router.post('/message' , async (req , res)=>{
    let {content , chat_id ,  created_by}  = req.body
    if(!content || !chat_id || !created_by)
        return res.status(400).json({err : "Not all data found"})
    try{
        let message  = await axios.post('localhost:8000/addMessage',{
            chat_id , 
            content ,
            created_by
        })
        if(message.status == 201)
            return res.status(200).json({ message });
    }
    catch(error){
        console.log(error)
        res.status(404).json({error : "Internal Server error"})
    }
})
router.post('/chats' , (req,res)=>{
    const {user_id} = req.body;
    axios.post('http://localhost:8000/chats' , {
        user_id
    })
    .then(msg =>{
        if(msg.data.error)
            return res.json({error : msg.data.error})
        return res.status(200).json({chat : msg.data.chat})
    })
    .catch(error=>{
        console.error(error)
        return res.status(404).json({error : "Internal Server Error"})
    })
})

router.post('/getPrevChat' , (req ,res)=>{
    const {chat_id} = req.body;
    axios.post('http://localhost:8000/getPrevChat' <{
        chat_id
    })
    .then(msg=>{
        if(msg.data.error)
            return res.json({error : msg.data.error})
        return res.status(200).json({messges: msg.data.data})
    })
    .catch(error => {
        console.error(error)
        return res.status(404).json({error})
    })
})

export default router