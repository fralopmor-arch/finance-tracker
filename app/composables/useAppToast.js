export const useAppToast = () => {
  const toast = useToast();

  const base = (opts) =>
    toast.add({
      duration: 5000,
      ...opts,
    });

  const toastAdd = ({ title, description = null }) =>
    base({
      title,
      description,
      icon: "i-heroicons-check-circle",
      type: "background",
      // fuerza color del contenedor, icono y barra de progreso (Tailwind JIT nested selectors)
      class:
        "bg-green-600 text-white [&_[data-slot=icon]]:text-white [&_[data-slot=progress]>div[data-slot=base]>div[data-slot=indicator]]:bg-green-400",
    });

  const toastDelete = ({ title, description = null }) =>
    base({
      title,
      description,
      icon: "i-heroicons-exclamation-circle",
      type: "background",
      class:
        "bg-red-600 text-white [&_[data-slot=icon]]:text-white [&_[data-slot=progress]>div[data-slot=base]>div[data-slot=indicator]]:bg-red-400",
    });

  return {
    // explicit simples
    toastAdd,
    toastDelete,
    // backward-compatible names
    toastSuccess: toastAdd,
    toastError: toastDelete,
  };
};
