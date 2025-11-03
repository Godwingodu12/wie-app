import Seated from "../../assets/ViewSingleEvent/Seated.svg";
import Standing from "../../assets/ViewSingleEvent/Standing.svg";
import Pets from "../../assets/ViewSingleEvent/Pets.svg";
import Kids from "../../assets/ViewSingleEvent/Kids.svg";
const getPreferences = (eventData) => {
  let Icon = "";
  let Label = "";

  const seatingArrangement = eventData?.seating_arrangement?.toLowerCase();

  switch (seatingArrangement) {
    case "standing":
      Icon = Standing;
      Label = "Standing";
      break;
    case "seated":
      Icon = Seated;
      Label = "Seated";
      break;
    case "seated and standing":
      Icon = Seated;
      Label = "Seated and Standing";
      break;
    default:
      Icon = Seated;
      Label = "None";
      break;
  }

  return [
    {
      type: "Seating",
      status: Label,
      Icons: Icon,
    },
    {
      type: "Pets",

      status: eventData?.pet_friendly ? "Allowed" : "Not Allowed",
      Icons: Pets,
    },
  ];
};

export default getPreferences;
