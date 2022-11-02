module.exports = {
  preset: "ts-jest",
  "verbose": true,
  roots: ["test/unit/", "src/"],
 reporters: ["default"],
 collectCoverage: true,
 coverageReporters: ["text-summary", "html"],
 coverageDirectory: "./test_reports/coverage",
 collectCoverageFrom: [
     "!test/**"
 ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFiles: ["./test/unit/mockers/init.js", "./test/unit/mockers/mock.js"],
  testEnvironment: 'node'
}
