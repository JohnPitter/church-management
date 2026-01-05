// Utility script to fix existing professionals that don't have working hours
// This should be run once to update existing data

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { firebaseConfig } from '../infrastructure/config/firebase';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixProfessionalsWorkingHours() {
  console.log('🔧 Fixing existing professionals without working hours...');
  
  try {
    const profissionaisRef = collection(db, 'profissionaisAssistencia');
    const snapshot = await getDocs(profissionaisRef);
    
    let fixedCount = 0;
    
    for (const docSnapshot of snapshot.docs) {
      const profissional = docSnapshot.data();
      
      // Check if professional has working hours and consultation time
      const needsWorkingHours = !profissional.horariosFuncionamento || profissional.horariosFuncionamento.length === 0;
      const needsConsultationTime = !profissional.tempoConsulta;
      
      if (needsWorkingHours || needsConsultationTime) {
        console.log(`📝 Updating professional: ${profissional.nome}`);
        
        const updateData = {};
        
        if (needsWorkingHours) {
          updateData.horariosFuncionamento = [
            { diaSemana: 1, horaInicio: '08:00', horaFim: '18:00' }, // Monday
            { diaSemana: 2, horaInicio: '08:00', horaFim: '18:00' }, // Tuesday  
            { diaSemana: 3, horaInicio: '08:00', horaFim: '18:00' }, // Wednesday
            { diaSemana: 4, horaInicio: '08:00', horaFim: '18:00' }, // Thursday
            { diaSemana: 5, horaInicio: '08:00', horaFim: '18:00' }, // Friday
          ];
        }
        
        if (needsConsultationTime) {
          updateData.tempoConsulta = 50; // 50 minutes default
        }
        
        const docRef = doc(db, 'profissionaisAssistencia', docSnapshot.id);
        await updateDoc(docRef, updateData);
        
        fixedCount++;
      }
    }
    
    console.log(`✅ Fixed ${fixedCount} professionals`);
    
  } catch (error) {
    console.error('❌ Error fixing professionals:', error);
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixProfessionalsWorkingHours().then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  });
}

export { fixProfessionalsWorkingHours };