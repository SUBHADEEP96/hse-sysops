import { fireEvent, render } from "@testing-library/react-native";
import { LookupSelector } from "./LookupSelector";

describe("LookupSelector", () => {
  test("selects exactly one normalized identifier", () => {
    const onSelect = jest.fn();
    const screen = render(
      <LookupSelector
        label="Country *"
        options={[
          { id: "1", name: "Australia" },
          { id: "2", name: "India" },
        ]}
        selectedId="1"
        onSelect={onSelect}
        placeholder="Select"
      />,
    );
    fireEvent.press(screen.getByLabelText("Country *"));
    const choices = screen.getAllByRole("radio");
    expect(choices[0].props.accessibilityState).toEqual({
      selected: true,
    });
    expect(choices[1].props.accessibilityState).toEqual({
      selected: false,
    });
    fireEvent.press(choices[1]);
    expect(onSelect).toHaveBeenCalledWith("2");
  });
});
