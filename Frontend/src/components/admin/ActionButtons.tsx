import { Link } from "react-router-dom";
import { Eye, Edit2, Trash2 } from "lucide-react";

interface Action {
  type: "view" | "edit" | "delete";
  href?: string;
  onClick?: () => void;
}

interface ActionButtonsProps {
  actions: Action[];
}

export default function ActionButtons({ actions }: ActionButtonsProps) {
  const getIcon = (type: Action["type"]) => {
    switch (type) {
      case "view":
        return <Eye className="w-4 h-4" />;
      case "edit":
        return <Edit2 className="w-4 h-4" />;
      case "delete":
        return <Trash2 className="w-4 h-4" />;
    }
  };

  const getButtonClass = (type: Action["type"]) => {
    const baseClass =
      "p-2 rounded-lg transition-colors inline-flex items-center justify-center";

    switch (type) {
      case "view":
        return `${baseClass} hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400`;
      case "edit":
        return `${baseClass} hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 dark:text-amber-400`;
      case "delete":
        return `${baseClass} hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400`;
    }
  };

  return (
    <div className="flex items-center justify-end gap-1">
      {actions.map((action, index) => {
        const buttonClass = getButtonClass(action.type);
        const icon = getIcon(action.type);

        if (action.href) {
          return (
            <Link key={index} to={action.href} className={buttonClass}>
              {icon}
            </Link>
          );
        }

        return (
          <button
            key={index}
            onClick={action.onClick}
            className={buttonClass}
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
}