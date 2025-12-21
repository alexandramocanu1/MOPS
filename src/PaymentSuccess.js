import { useEffect } from 'react';
import emailjs from '@emailjs/browser';
import { useLocation } from 'react-router-dom';

function PaymentSuccess() {
    const location = useLocation();

    const params = new URLSearchParams(location.search);
    const doctorName = params.get('doctorName') || 'Medease';
    const patientName = params.get('patientName') || 'Pacient';

    useEffect(() => {
        emailjs.send('service_y4pegi9', 'template_vj603vv', {
            doctorName,
            patientName
        })
        .then(() => {
            console.log('Email trimis cu succes!');
        })
        .catch(err => console.error('Eroare la trimiterea emailului:', err));
    }, [doctorName, patientName]);

    return (
        <div style={{textAlign: 'center', marginTop: '50px'}}>
            <h1> Plata a fost confirmata!</h1>
            <p>Va multumim pentru plata efectuata. Un email de confirmare a fost trimis.</p>
        </div>
    );
}

export default PaymentSuccess;
