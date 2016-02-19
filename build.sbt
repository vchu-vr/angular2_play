name := """VisierTemplate"""

version := "1.0-SNAPSHOT"

lazy val root = (project in file(".")).enablePlugins(PlayScala)

scalaVersion := "2.11.6"

libraryDependencies ++= Seq(
  jdbc,
  cache,
  ws,
  specs2 % Test
)

resolvers += "scalaz-bintray" at "http://dl.bintray.com/scalaz/releases"

TypescriptKeys.module := "system"
TypescriptKeys.sourceMap := true
TypescriptKeys.experimentalDecorators := true
TypescriptKeys.emitDecoratorMetadata := true
TypescriptKeys.moduleResolution := "node"

// Play provides two styles of routers, one expects its actions to be injected, the
// other, legacy style, accesses its actions statically.
routesGenerator := InjectedRoutesGenerator
