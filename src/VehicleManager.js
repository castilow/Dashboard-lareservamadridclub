import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const VehicleManager = () => {
  const [vehicles, setVehicles] = useState([]);
  const [formData, setFormData] = useState({ model: '', year: '', color: '', precio: '', image: '', link: '' });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchVehicles();

    // Suscribirse a cambios en tiempo real en la tabla "vehicles"
    const vehicleSubscription = supabase
      .from('vehicles')
      .on('*', (payload) => {
        fetchVehicles(); // Re-obtener los vehículos cuando haya algún insert, update o delete
      })
      .subscribe();

    return () => {
      supabase.removeSubscription(vehicleSubscription); // Cancelar suscripción al desmontar el componente
    };
  }, []);

  const fetchVehicles = async () => {
    const { data, error } = await supabase.from('vehicles').select('*');
    if (error) {
      setMessage("Error al obtener los vehículos");
    } else {
      setVehicles(data);
      setMessage("Vehículos cargados correctamente");
    }
  };

  const handleAddVehicle = async () => {
    if (!formData.model || !formData.year || !formData.color || !formData.precio || !formData.image || !formData.link) {
      setMessage("Todos los campos son obligatorios");
      return;
    }

    const { data, error } = await supabase.from('vehicles').insert([formData]);
    if (error) {
      setMessage("Error al agregar el vehículo");
    } else {
      setFormData({ model: '', year: '', color: '', precio: '', image: '', link: '' });
      setMessage("Vehículo agregado con éxito");
    }
  };

  const handleDeleteVehicle = async (id) => {
    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    if (error) {
      setMessage("Error al eliminar el vehículo");
    } else {
      setMessage("Vehículo eliminado con éxito");
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center' }}>Gestión de Vehículos</h1>
      {message && <p style={{ textAlign: 'center', color: 'green' }}>{message}</p>}
      {/* Aquí puedes agregar el formulario y la lista de vehículos */}
    </div>
  );
};

export default VehicleManager;
