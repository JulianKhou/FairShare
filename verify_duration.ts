import { prepareContractData } from "./src/utils/prepareContract";

const videoCreator = {
    id: "v1",
    duration_seconds: 600,
    snippet: { channelTitle: "C1" }
};
const videoReactor = {
    id: "v2",
    duration_seconds: 300,
    snippet: { channelTitle: "C2" }
};
const prices = { oneTime: 10, payPerViews: 1, payPerCpm: 0.5 };

const contract = prepareContractData({
    videoCreator,
    videoReactor,
    selectedPlan: "monthly",
    prices
});

console.log("Duration:", contract.original_video_duration);

if (contract.original_video_duration === "600 seconds") {
    console.log("PASS: Duration format correct");
} else {
    console.error("FAIL: Duration format incorrect", contract.original_video_duration);
    process.exit(1);
}
