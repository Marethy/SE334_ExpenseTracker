import renderer from "react-test-renderer";
import { PieVariant } from "../pie-variant";

describe("PieVariant colors", () => {
  it("uses custom colors when provided", () => {
    const tree = renderer.create(
      <PieVariant data={[{ name: "a", value: 1 }]} colors={["#111111"]} />,
    );
    const cell = tree.root.findByProps({ fill: "#111111" });
    expect(cell).toBeTruthy();
  });
});
