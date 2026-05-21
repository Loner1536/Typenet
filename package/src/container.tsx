// Packages
import Vide, { source, spring, effect, Index } from "@rbxts/vide";
import Object from "@rbxts/object-utils";

// Types
import * as Types from "./types";

// Hook
import { px } from "./hook/usePx";

export default function Container({
	src,
	x,
	y,
}: {
	src: Vide.Source<Types.CornerEntry[]>;
	x: "left" | "right";
	y: "top" | "bottom";
}) {
	return (
		<Index each={src}>
			{(data, index, show) => {
				const snapshot = source(data());
				const transitioning = source(false);

				effect(() => {
					const current = data();
					if (!show()) {
						transitioning(false);
						snapshot(current);
						return;
					}
					if (current === snapshot()) return;

					transitioning(true);
					task.delay(0.12, () => {
						snapshot(current);
						transitioning(false);
					});
				});

				const xDir = x === "right" ? 1 : -1;
				const yOffset = spring(() => (show() && !transitioning() ? 0 : -8), 0.25, 0.5)[0];
				const xOffset = spring(() => (show() && !transitioning() ? 0 : 50 * xDir), 0.25, 0.5)[0];

				function fade(num?: number) {
					return spring(() => (show() && !transitioning() ? (num ?? 0) : 1), 0.2, 1)[0];
				}

				return $tuple(
					<frame
						Name={() => `${snapshot().label} ${snapshot().id}`}
						BackgroundTransparency={1}
						AutomaticSize={() => (show() ? "Y" : "None")}
						Size={() => UDim2.fromScale(1, 0)}
						LayoutOrder={() => (y === "bottom" ? -index : index)}
						ClipsDescendants={false}
					>
						<frame
							Name={"Container"}
							BackgroundTransparency={fade(0.5)}
							BackgroundColor3={Color3.fromRGB(10, 10, 10)}
							AnchorPoint={new Vector2(x === "right" ? 1 : 0, 0)}
							Position={() => new UDim2(x === "right" ? 1 : 0, px(xOffset()), 0, px(yOffset()))}
							AutomaticSize={"XY"}
						>
							<uicorner CornerRadius={() => new UDim(0, px(20))} />
							<uilistlayout
								Padding={() => new UDim(0, px(7.5))}
								VerticalAlignment={"Center"}
								HorizontalAlignment={"Left"}
								FillDirection={"Horizontal"}
							/>
							<uipadding
								PaddingLeft={() => new UDim(0, px(10))}
								PaddingRight={() => new UDim(0, px(10))}
								PaddingTop={() => new UDim(0, px(6))}
								PaddingBottom={() => new UDim(0, px(6))}
							/>

							<frame
								Name={"Tag"}
								BackgroundTransparency={1}
								Size={UDim2.fromOffset(0, 0)}
								AutomaticSize={"XY"}
								LayoutOrder={1}
							>
								<uicorner CornerRadius={() => new UDim(0, px(20))} />
								<textlabel
									Name={"Text"}
									BackgroundTransparency={1}
									TextColor3={() =>
										snapshot().tag === "client"
											? Color3.fromRGB(140, 255, 255)
											: Color3.fromRGB(255, 30, 140)
									}
									TextTransparency={fade()}
									TextSize={() => px(14)}
									Text={() => snapshot().tag}
									Font={"FredokaOne"}
									TextYAlignment={"Center"}
									TextXAlignment={"Center"}
									Size={UDim2.fromOffset(0, 0)}
									AutomaticSize={"XY"}
								>
									<uistroke Thickness={() => px(2)} Transparency={fade()} />
								</textlabel>
							</frame>

							<frame
								Name={"Type"}
								BackgroundTransparency={1}
								Size={UDim2.fromOffset(0, 0)}
								AutomaticSize={"XY"}
								LayoutOrder={2}
							>
								<uicorner CornerRadius={() => new UDim(0, px(20))} />
								<textlabel
									Name={"Text"}
									BackgroundTransparency={1}
									TextColor3={() =>
										snapshot().type === "INFO"
											? Color3.fromRGB(30, 255, 140)
											: Color3.fromRGB(100, 255, 100)
									}
									TextTransparency={fade()}
									TextSize={() => px(14)}
									Text={() => snapshot().type}
									Font={"FredokaOne"}
									TextYAlignment={"Center"}
									TextXAlignment={"Center"}
									Size={UDim2.fromOffset(0, 0)}
									AutomaticSize={"XY"}
								>
									<uistroke Thickness={() => px(2)} Transparency={fade()} />
								</textlabel>
							</frame>

							<frame
								Name={"Label"}
								BackgroundTransparency={1}
								Size={UDim2.fromOffset(0, 0)}
								AutomaticSize={"XY"}
								LayoutOrder={3}
							>
								<uicorner CornerRadius={() => new UDim(0, px(20))} />
								<textlabel
									Name={"Text"}
									BackgroundTransparency={1}
									TextTransparency={fade(0.2)}
									TextColor3={Color3.fromRGB(255, 255, 255)}
									TextSize={() => px(14)}
									Text={() => snapshot().label}
									Font={"FredokaOne"}
									TextYAlignment={"Center"}
									TextXAlignment={"Center"}
									Size={UDim2.fromOffset(0, 0)}
									AutomaticSize={"XY"}
								>
									<uistroke Thickness={() => px(2)} Transparency={fade()} />
								</textlabel>
							</frame>

							<frame
								Name={"Text"}
								BackgroundTransparency={1}
								Size={UDim2.fromOffset(0, 0)}
								AutomaticSize={"XY"}
								LayoutOrder={4}
							>
								<textlabel
									Name={"Text"}
									BackgroundTransparency={1}
									RichText={true}
									TextTransparency={fade()}
									TextSize={() => px(14)}
									Font={"FredokaOne"}
									TextColor3={Color3.fromRGB(255, 255, 255)}
									TextYAlignment={"Center"}
									TextXAlignment={"Left"}
									Size={UDim2.fromOffset(0, 0)}
									AutomaticSize={"XY"}
									Text={() =>
										Object.entries(snapshot().data)
											.map(
												([key, val]) =>
													`<font color="rgb(30, 140, 255)">${key}</font><font color="rgb(255,255,255)">=</font><font color="rgb(255, 140, 30)">${tostring(val)}</font>`,
											)
											.join("  ")
									}
								>
									<uistroke Thickness={() => px(2)} Transparency={fade()} />
								</textlabel>
							</frame>
						</frame>
					</frame>,
					2,
				);
			}}
		</Index>
	);
}
