// src/RestaurantManagementSystem.jsx

import React, { useState, useEffect } from "react";
import {
  FaEye,
  FaEyeSlash,
  FaSpinner,
  FaPlus,
  FaEdit,
  FaCheck,
  FaQrcode,
  FaList,
  FaSearch,
  FaTrash,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { IoFastFoodOutline } from "react-icons/io5";
import {
  BiCategoryAlt,
  BiQrScan,
  BiUser,
  BiError,
  BiStore,
} from "react-icons/bi";
import { MdRateReview, MdQrCode2 } from "react-icons/md";
import {
  FiDownload,
  FiExternalLink,
  FiEdit2,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { QRCodeCanvas } from "qrcode.react";
import { jsPDF } from "jspdf";
import { supabase } from "./supabaseClient"; // Asegúrate de que la ruta sea correcta

const RestaurantManagementSystem = () => {
  // Estado de autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const savedAuth = localStorage.getItem("isAuthenticated");
    return savedAuth === "true";
  });

  // Panel activo en la interfaz
  const [activePanel, setActivePanel] = useState("products");

  // Estados y funciones para autenticación
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Estados y funciones para gestión de productos
  const [menuItems, setMenuItems] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedVenue, setSelectedVenue] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formDataItem, setFormDataItem] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    venue: "restaurante",
    allergens: [],
    video_url: null,
    videoFile: null,
  });

  const [showSidebar, setShowSidebar] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Datos de categorías y navegación
  const categories = [
    {
      id: "all",
      name: "Todas las Categorías",
      venue: "all",
      type: "all",
      icon: <BiCategoryAlt />,
    },
    // Categorías para el restaurante (comida)
    {
      id: "seleccion_gourmet",
      name: "Selección Gourmet",
      venue: "restaurante",
      type: "food",
      icon: <IoFastFoodOutline />,
    },
    {
      id: "entrantes_compartir",
      name: "Entrantes para Compartir",
      venue: "restaurante",
      type: "food",
      icon: <IoFastFoodOutline />,
    },
    {
      id: "frescor_huerta",
      name: "Frescor de la Huerta",
      venue: "restaurante",
      type: "food",
      icon: <IoFastFoodOutline />,
    },
    {
      id: "del_mar_tierra",
      name: "Del Mar y de la Tierra",
      venue: "restaurante",
      type: "food",
      icon: <IoFastFoodOutline />,
    },
    {
      id: "dulce_final",
      name: "Dulce Final",
      venue: "restaurante",
      type: "food",
      icon: <IoFastFoodOutline />,
    },
    {
      id: "menu_infantil",
      name: "Menú Infantil",
      venue: "restaurante",
      type: "food",
      icon: <IoFastFoodOutline />,
    },
    // Categorías de bebidas
    {
      id: "vinos_bebidas",
      name: "Vinos y Bebidas",
      venue: "restaurante",
      type: "beverage",
      icon: <IoFastFoodOutline />,
    },
    {
      id: "espectaculo",
      name: "Espectáculo",
      venue: "discoteca",
      type: "beverage",
      icon: <IoFastFoodOutline />,
    },
  ];

  const navigationLinks = [
    { id: "products", name: "Productos", icon: <FaList /> },
    { id: "qrGenerator", name: "Generador de QR", icon: <MdQrCode2 /> },
    { id: "users", name: "Usuarios", icon: <BiUser /> },
    { id: "reviews", name: "Reseñas", icon: <MdRateReview /> },
  ];

  // Listas de alérgenos
  const foodAllergens = [
    "Gluten",
    "Lácteos",
    "Huevos",
    "Pescado",
    "Crustáceos (mariscos)",
    "Moluscos",
    "Frutos secos",
    "Cacahuetes",
    "Soja",
    "Apio",
    "Mostaza",
    "Sésamo",
    "Sulfitos",
    "Altramuces",
  ];

  const beverageAllergens = [
    "Gluten",
    "Lácteos",
    "Sulfitos",
    "Frutos secos",
    "Soja",
  ];

  // Funciones de autenticación

  // Validar credenciales de inicio de sesión (hardcoded para simplicidad)
  const validateCredentials = (email, password) => {
    // Reemplaza esto con tu lógica de validación real o utiliza Supabase Auth
    return email === "lareserva@club.com" && password === "LaReserva2024";
  };

  // Manejar cambios en los campos del formulario de autenticación
  const handleInputChangeAuth = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  // Validar campos individuales del formulario de autenticación
  const validateField = (name, value) => {
    let error = "";
    if (name === "email") {
      if (!value) {
        error = "El correo electrónico es requerido";
      } else if (!/\S+@\S+\.\S+/.test(value)) {
        error = "Correo electrónico inválido";
      }
    } else if (name === "password") {
      if (!value) {
        error = "La contraseña es requerida";
      }
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  // Manejar envío del formulario de autenticación
  const handleSubmitAuth = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setErrors({
        email: !formData.email ? "El correo electrónico es requerido" : "",
        password: !formData.password ? "La contraseña es requerida" : "",
      });
      return;
    }

    if (validateCredentials(formData.email, formData.password)) {
      setIsLoading(true);
      // Simular una espera para mostrar el spinner
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setIsLoading(false);
      setIsAuthenticated(true);
      localStorage.setItem("isAuthenticated", "true");
      // Cargar los platos una vez autenticado
      fetchDishes();
    } else {
      setErrors({
        email: "Correo electrónico o contraseña incorrectos",
        password: "Correo electrónico o contraseña incorrectos",
      });
    }
  };

  // Funciones para manejo de productos

  // Función para obtener los platos desde Supabase
  const fetchDishes = async () => {
    const { data, error } = await supabase.from("platos").select("*");
    if (error) {
      console.error("Error al cargar los platos:", error);
      alert("Error al cargar los platos");
    } else {
      setMenuItems(data);
    }
  };

  // Manejar la apertura del modal para agregar un nuevo producto
  const handleAddItem = () => {
    setEditItem(null);
    setFormDataItem({
      name: "",
      description: "",
      price: "",
      category: "",
      venue: selectedVenue !== "all" ? selectedVenue : "restaurante",
      allergens: [],
      video_url: null,
      videoFile: null,
    });
    setIsModalOpen(true);
  };

  // Manejar la edición de un producto existente
  const handleEditItem = (item) => {
    setEditItem(item);
    setFormDataItem({
      ...item,
      videoFile: null, // Limpiamos el archivo de video al editar
    });
    setIsModalOpen(true);
  };

  // Manejar la eliminación de un producto
  const handleDeleteItem = async (itemId) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este elemento?")) {
      const itemToDelete = menuItems.find((item) => item.id === itemId);

      // Eliminar el registro de la base de datos
      const { error } = await supabase.from("platos").delete().eq("id", itemId);

      if (error) {
        console.error("Error al eliminar el plato:", error);
        alert("Error al eliminar el plato");
        return;
      }

      // Eliminar el video del almacenamiento si existe
      if (itemToDelete.video_url) {
        const videoPath = itemToDelete.video_url.split("/storage/v1/object/public/videos/")[1];
        const { error: deleteError } = await supabase.storage.from("videos").remove([videoPath]);

        if (deleteError) {
          console.error("Error al eliminar el video:", deleteError);
          alert("Error al eliminar el video asociado");
        }
      }

      // Actualizar el estado local
      setMenuItems(menuItems.filter((item) => item.id !== itemId));
    }
  };

  // Manejar cambios en el archivo de video seleccionado
  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormDataItem({ ...formDataItem, videoFile: file });
    }
  };

  // Manejar cambios en los campos del formulario de productos
  const handleInputChangeItem = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      if (checked) {
        setFormDataItem({
          ...formDataItem,
          allergens: [...formDataItem.allergens, value],
        });
      } else {
        setFormDataItem({
          ...formDataItem,
          allergens: formDataItem.allergens.filter((a) => a !== value),
        });
      }
    } else {
      setFormDataItem({ ...formDataItem, [name]: value });
    }
  };

  // Función para determinar el tipo de producto basado en la categoría seleccionada
  const getProductType = () => {
    const selectedCat = categories.find(
      (cat) => cat.id === formDataItem.category
    );
    return selectedCat ? selectedCat.type : "food";
  };

  // Manejar el envío del formulario de productos
  const handleSubmitItem = async (e) => {
    e.preventDefault();

    let video_url = formDataItem.video_url;

    if (formDataItem.videoFile) {
      // Subir el video a Supabase Storage
      const fileName = `videos/${Date.now()}_${formDataItem.videoFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("videos")
        .upload(fileName, formDataItem.videoFile);

      if (uploadError) {
        console.error("Error al subir el video:", uploadError);
        alert("Error al subir el video");
        return;
      }

      // Obtener la URL pública del video
      const { data: publicVideoUrl, error: publicUrlError } = supabase
        .storage
        .from("videos")
        .getPublicUrl(uploadData.path);

      if (publicUrlError) {
        console.error("Error al obtener la URL pública del video:", publicUrlError);
        alert("Error al obtener la URL pública del video");
        return;
      }

      video_url = publicVideoUrl.publicUrl;
    }

    const dishData = {
      name: formDataItem.name,
      description: formDataItem.description,
      price: parseFloat(formDataItem.price),
      category: formDataItem.category,
      venue: formDataItem.venue,
      allergens: formDataItem.allergens,
      video_url,
    };

    if (editItem) {
      // Actualizar plato existente
      const { error } = await supabase
        .from("platos")
        .update(dishData)
        .eq("id", editItem.id);

      if (error) {
        console.error("Error al actualizar el plato:", error);
        alert("Error al actualizar el plato");
        return;
      }
    } else {
      // Insertar nuevo plato
      const { error } = await supabase.from("platos").insert([dishData]);

      if (error) {
        console.error("Error al insertar el plato:", error);
        alert("Error al insertar el plato");
        return;
      }
    }

    // Recargar los platos
    fetchDishes();
    setIsModalOpen(false);
  };

  // Filtrar los productos según la búsqueda y selección
  const filteredItems = menuItems.filter((item) => {
    const matchesVenue =
      selectedVenue === "all" || item.venue === selectedVenue;
    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesVenue && matchesCategory && matchesSearch;
  });

  // Componente QRGenerator
  const QRGenerator = () => {
    const [url, setUrl] = useState("");
    const [error, setError] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [showQR, setShowQR] = useState(false);

    // Validar que la URL ingresada sea válida
    const validateURL = (input) => {
      try {
        new URL(input);
        return true;
      } catch (err) {
        return false;
      }
    };

    // Manejar la generación del código QR
    const handleGenerate = () => {
      if (!url) {
        setError("Por favor, ingresa una URL");
        setShowQR(false);
        return;
      }

      if (!validateURL(url)) {
        setError("Por favor, ingresa una URL válida");
        setShowQR(false);
        return;
      }

      setError("");
      setIsGenerating(true);

      setTimeout(() => {
        setIsGenerating(false);
        setShowQR(true);
      }, 1000);
    };

    // Manejar la descarga del código QR como PDF
    const handleDownload = () => {
      const canvas = document.getElementById("qr-code-canvas");
      if (canvas) {
        const pdf = new jsPDF();
        const imgData = canvas.toDataURL("image/png");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = 100;
        const imgHeight = 100;
        const x = (pdfWidth - imgWidth) / 2;
        const y = (pdfHeight - imgHeight) / 2;

        pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
        pdf.text("Código QR para: " + url, 10, 20);
        pdf.save("codigo_qr.pdf");
      }
    };

    // Manejar la apertura del enlace en una nueva pestaña
    const handleOpenLink = () => {
      if (validateURL(url)) {
        window.open(url, "_blank");
      }
    };

    return (
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <div className="relative">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Ingresa la URL aquí"
              aria-label="Entrada de URL"
              className="w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 outline-none bg-gray-700 text-white placeholder-gray-400"
            />
            {error && (
              <div className="absolute -bottom-6 left-0 flex items-center text-yellow-400 text-sm">
                <BiError className="mr-1" />
                {error}
              </div>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            aria-label="Generar Código QR"
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isGenerating ? "Generando..." : "Generar Código QR"}
          </button>
        </div>

        {showQR && (
          <div className="flex-1 flex flex-col items-center space-y-6 animate-fade-in">
            <div
              className="p-4 bg-gray-700 rounded-xl shadow-md cursor-pointer hover:shadow-lg transition-shadow duration-200"
              onClick={handleOpenLink}
              role="button"
              aria-label="Clic para abrir URL"
            >
              <QRCodeCanvas
                id="qr-code-canvas"
                value={url}
                size={200}
                bgColor="#374151"
                fgColor="#FFFFFF"
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleDownload}
                className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                aria-label="Descargar Código QR como PDF"
              >
                <FiDownload />
                <span>Descargar PDF</span>
              </button>

              <button
                onClick={handleOpenLink}
                className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                aria-label="Abrir URL"
              >
                <FiExternalLink />
                <span>Abrir Enlace</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );

    // Nota: Este return está fuera de lugar. Se moverá abajo.
  };

  // Renderización principal
  if (isAuthenticated) {
    return (
      <div className="flex h-screen bg-gray-900">
        {/* Menú lateral */}
        <div
          className={`fixed inset-y-0 left-0 transform ${
            showSidebar ? "translate-x-0" : "-translate-x-full"
          } md:relative md:translate-x-0 transition-transform duration-200 ease-in-out w-64 bg-gray-800 p-6 z-40 overflow-y-auto max-h-screen`}
        >
          {/* Botón para cerrar el menú en móviles */}
          <div className="md:hidden flex justify-end">
            <button
              className="text-white mb-4"
              onClick={() => setShowSidebar(false)}
            >
              <FaTimes size={24} />
            </button>
          </div>

          {/* Logo */}
          <div className="mb-6">
            <img
              src="/img/Logo.png"
              alt="Logo"
              className="w-20 h-auto mx-auto object-contain"
            />
          </div>

          <div className="space-y-4">
            {navigationLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  setActivePanel(link.id);
                  setShowSidebar(false);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg ${
                  activePanel === link.id ? "bg-yellow-500" : "bg-gray-700"
                } text-white transition-colors`}
              >
                {link.icon} {link.name}
              </button>
            ))}
          </div>

          {activePanel === "products" && (
            <>
              {/* Sección de Local */}
              <div className="pt-6 border-t border-gray-700">
                <p className="px-2 text-xs font-semibold text-gray-400 mb-4">
                  ¿QUÉ LOCAL ES?
                </p>
                <button
                  onClick={() => {
                    setSelectedVenue("all");
                    setSelectedCategory("all");
                  }}
                  className={`w-full flex items-center px-2 py-3 mb-1 rounded-lg ${
                    selectedVenue === "all"
                      ? "bg-yellow-500 text-white"
                      : "text-gray-300 hover:bg-gray-800"
                  } transition-colors duration-200`}
                >
                  <BiStore className="text-xl mr-4" />
                  <span>Todos los Locales</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedVenue("restaurante");
                    setSelectedCategory("all");
                  }}
                  className={`w-full flex items-center px-2 py-3 mb-1 rounded-lg ${
                    selectedVenue === "restaurante"
                      ? "bg-yellow-500 text-white"
                      : "text-gray-300 hover:bg-gray-800"
                  } transition-colors duration-200`}
                >
                  <BiStore className="text-xl mr-4" />
                  <span>Restaurante</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedVenue("discoteca");
                    setSelectedCategory("all");
                  }}
                  className={`w-full flex items-center px-2 py-3 mb-1 rounded-lg ${
                    selectedVenue === "discoteca"
                      ? "bg-yellow-500 text-white"
                      : "text-gray-300 hover:bg-gray-800"
                  } transition-colors duration-200`}
                >
                  <BiStore className="text-xl mr-4" />
                  <span>Discoteca</span>
                </button>
              </div>

              {/* Sección de Categorías */}
              <div className="pt-6 border-t border-gray-700">
                <p className="px-2 text-xs font-semibold text-gray-400 mb-4">
                  CATEGORÍAS
                </p>
                {categories
                  .filter(
                    (category) =>
                      selectedVenue === "all" ||
                      category.venue === selectedVenue ||
                      category.venue === "all"
                  )
                  .map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center px-2 py-3 mb-1 rounded-lg ${
                        selectedCategory === category.id
                          ? "bg-yellow-500 text-white"
                          : "text-gray-300 hover:bg-gray-800"
                      } transition-colors duration-200`}
                    >
                      <span className="text-xl mr-4">{category.icon}</span>
                      <span>{category.name}</span>
                    </button>
                  ))}
              </div>
            </>
          )}
        </div>

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col">
          {/* Header para móviles */}
          <div className="md:hidden flex items-center justify-between p-4 bg-gray-800">
            {/* Botón de menú */}
            <button className="text-white" onClick={() => setShowSidebar(true)}>
              <FaBars size={24} />
            </button>
            {/* Barra de búsqueda */}
            <div className="flex-1 mx-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            {/* Botón de agregar producto */}
            {activePanel === "products" && (
              <button
                onClick={handleAddItem}
                className="px-2 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center"
              >
                <FaPlus />
              </button>
            )}
          </div>

          {/* Contenido */}
          <div className="flex-1 p-8 overflow-auto">
            {/* Búsqueda y botón de agregar (escritorio) */}
            {activePanel === "products" && (
              <div className="hidden md:flex justify-between items-center mb-6">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o descripción..."
                      className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddItem}
                  className="ml-4 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2"
                >
                  <FaPlus /> Agregar Producto
                </button>
              </div>
            )}

            {/* Contenido principal dependiendo del panel activo */}
            {activePanel === "products" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-800 rounded-xl shadow-xl overflow-hidden transition-all duration-300 hover:transform hover:scale-105"
                  >
                    <div className="w-full h-48 relative bg-gray-700">
                      {item.video_url && (
                        <video
                          src={item.video_url}
                          className="w-full h-full object-cover"
                          controls
                        ></video>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-semibold text-gray-100">
                          {item.name}
                        </h3>
                        <span className="text-lg font-bold text-yellow-500">
                          ${item.price}
                        </span>
                      </div>
                      <p className="text-gray-400 mb-4">{item.description}</p>
                      {/* Mostrar alérgenos */}
                      {item.allergens && item.allergens.length > 0 && (
                        <div className="mb-4">
                          <p className="text-gray-300 font-semibold mb-1">
                            Alérgenos:
                          </p>
                          <ul className="list-disc list-inside text-gray-400">
                            {item.allergens.map((allergen) => (
                              <li key={allergen}>{allergen}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="p-2 text-blue-400 hover:bg-blue-900 hover:bg-opacity-50 rounded-full transition-colors"
                          aria-label="Editar elemento"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-2 text-red-400 hover:bg-red-900 hover:bg-opacity-50 rounded-full transition-colors"
                          aria-label="Eliminar elemento"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activePanel === "qrGenerator" && (
              <div className="max-w-4xl mx-auto bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-10 border border-gray-700">
                <h1 className="text-3xl font-bold text-white mb-8 text-center">
                  Generador de Código QR
                </h1>
                <QRGenerator />
              </div>
            )}

            {activePanel === "users" && (
              <div className="flex items-center justify-center h-full">
                <h2 className="text-2xl text-white">Gestión de Usuarios</h2>
                {/* Aquí puedes agregar el componente de gestión de usuarios */}
              </div>
            )}

            {activePanel === "reviews" && (
              <div className="flex items-center justify-center h-full">
                <h2 className="text-2xl text-white">Reseñas</h2>
                {/* Aquí puedes agregar el componente de reseñas */}
              </div>
            )}
          </div>
        </div>

        {/* Modal para Agregar/Editar Producto */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl overflow-y-auto max-h-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-100">
                  {editItem ? "Editar Producto" : "Agregar Nuevo Producto"}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-400"
                >
                  <FiX />
                </button>
              </div>
              <form onSubmit={handleSubmitItem} className="space-y-4">
                {/* Campos del formulario */}
                <div>
                  <label className="block text-gray-300 mb-2" htmlFor="name">
                    Nombre
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formDataItem.name}
                    onChange={(e) =>
                      setFormDataItem({ ...formDataItem, name: e.target.value })
                    }
                    className="w-full p-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2" htmlFor="description">
                    Descripción
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    required
                    value={formDataItem.description}
                    onChange={(e) =>
                      setFormDataItem({
                        ...formDataItem,
                        description: e.target.value,
                      })
                    }
                    className="w-full p-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-gray-100"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-gray-300 mb-2" htmlFor="price">
                    Precio
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    required
                    step="0.01"
                    value={formDataItem.price}
                    onChange={(e) =>
                      setFormDataItem({ ...formDataItem, price: e.target.value })
                    }
                    className="w-full p-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2" htmlFor="venue">
                    Local
                  </label>
                  <select
                    id="venue"
                    name="venue"
                    value={formDataItem.venue}
                    onChange={(e) =>
                      setFormDataItem({
                        ...formDataItem,
                        venue: e.target.value,
                        category: "",
                      })
                    }
                    className="w-full p-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-gray-100"
                  >
                    <option value="restaurante">Restaurante</option>
                    <option value="discoteca">Discoteca</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 mb-2" htmlFor="category">
                    Categoría
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formDataItem.category}
                    onChange={(e) =>
                      setFormDataItem({
                        ...formDataItem,
                        category: e.target.value,
                        allergens: [],
                      })
                    }
                    className="w-full p-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-gray-100"
                  >
                    <option value="">Selecciona una Categoría</option>
                    {categories
                      .filter(
                        (category) =>
                          (category.venue === formDataItem.venue ||
                            category.venue === "all") &&
                          category.id !== "all"
                      )
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                </div>
                {/* Sección de Alérgenos */}
                <div>
                  <label className="block text-gray-300 mb-2">Alérgenos</label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {getProductType() === "beverage"
                      ? beverageAllergens.map((allergen) => (
                          <label
                            key={allergen}
                            className="flex items-center text-gray-100"
                          >
                            <input
                              type="checkbox"
                              value={allergen}
                              checked={formDataItem.allergens.includes(allergen)}
                              onChange={handleInputChangeItem}
                              name="allergens"
                              className="mr-2"
                            />
                            {allergen}
                          </label>
                        ))
                      : foodAllergens.map((allergen) => (
                          <label
                            key={allergen}
                            className="flex items-center text-gray-100"
                          >
                            <input
                              type="checkbox"
                              value={allergen}
                              checked={formDataItem.allergens.includes(allergen)}
                              onChange={handleInputChangeItem}
                              name="allergens"
                              className="mr-2"
                            />
                            {allergen}
                          </label>
                        ))}
                  </div>
                </div>
                <div>
                  <label className="block text-gray-300 mb-2" htmlFor="video">
                    Subir Video
                  </label>
                  <input
                    type="file"
                    id="video"
                    name="video"
                    accept="video/mp4,video/webm"
                    onChange={handleVideoChange}
                    className="w-full p-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-white hover:file:bg-yellow-600"
                  />
                  {formDataItem.videoFile && (
                    <div className="mt-2">
                      <p className="text-gray-400">
                        Video seleccionado: {formDataItem.videoFile.name}
                      </p>
                    </div>
                  )}
                  {formDataItem.video_url && !formDataItem.videoFile && (
                    <div className="mt-2">
                      <video
                        src={formDataItem.video_url}
                        className="w-full h-32 object-cover rounded-lg"
                        controls
                      ></video>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 transition-all duration-300 shadow-lg"
                >
                  {editItem ? "Actualizar Producto" : "Agregar Producto"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal ya incluido arriba */}
      </div>
    );
  }

  // Formulario de inicio de sesión
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-900 bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1555992336-03a23f940b92')",
      }}
    >
      <div className="relative w-full max-w-md mx-4 px-6 pt-10 pb-8 bg-gray-800/90 shadow-2xl backdrop-blur-lg rounded-3xl space-y-8 border border-gray-700">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-800/50 to-black/50 rounded-3xl backdrop-blur-xl filter" />
        <div className="relative">
          <h2 className="text-center text-4xl font-bold tracking-tight text-white mb-8 drop-shadow-lg">
            LA RESERVA CLUB - Iniciar Sesión
          </h2>
          <form className="mt-8 space-y-6" onSubmit={handleSubmitAuth}>
            <div className="rounded-md space-y-4">
              <div className="relative">
                <label htmlFor="email" className="sr-only">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`block w-full px-4 py-3 rounded-2xl bg-gray-700/50 backdrop-blur-sm border ${
                    errors.email ? "border-yellow-500" : "border-gray-600"
                  } text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300`}
                  placeholder="Correo electrónico"
                  value={formData.email}
                  onChange={handleInputChangeAuth}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-yellow-400 font-medium">
                    {errors.email}
                  </p>
                )}
              </div>
              <div className="relative flex items-center">
                <label htmlFor="password" className="sr-only">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className={`block w-full px-4 py-3 pr-12 rounded-2xl bg-gray-700/50 backdrop-blur-sm border ${
                    errors.password ? "border-yellow-500" : "border-gray-600"
                  } text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300`}
                  placeholder="Contraseña"
                  value={formData.password}
                  onChange={handleInputChangeAuth}
                />
                <button
                  type="button"
                  className="absolute right-3 text-gray-400 hover:text-white focus:outline-none transition-colors duration-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FaEyeSlash className="w-5 h-5" />
                  ) : (
                    <FaEye className="w-5 h-5" />
                  )}
                </button>
                {errors.password && (
                  <p className="mt-2 text-sm text-yellow-400 font-medium">
                    {errors.password}
                  </p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={
                  isLoading ||
                  Object.values(errors).some((error) => error) ||
                  !formData.email ||
                  !formData.password
                }
                className="w-full py-3 px-4 rounded-2xl text-white bg-gradient-to-r from-yellow-500 to-yellow-700 hover:from-yellow-600 hover:to-yellow-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-yellow-500 disabled:hover:to-yellow-700 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <FaSpinner className="animate-spin h-5 w-5 mx-auto" />
                ) : (
                  "Iniciar Sesión"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RestaurantManagementSystem;